import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { rootLogger as logger } from '../utils/logger';
import S3Component from '../components/s3.component';
import { v4 as uuidv4 } from 'uuid';

export interface PdfGenerationResult {
  presignedUrl: string;
  s3Key: string;
  bucket: string;
}

export interface LeaveTakenReportData {
  companyName: string;
  reportPeriod: string;
  reportData: Array<{
    leaveType: {
      id: number;
      code?: string;
      name?: string;
    };
    department: Array<{
      id?: number;
      code?: string;
      name?: string;
      employees: Array<{
        id: number;
        employeeNumber: string;
        name: string;
        numberOfDays: number;
      }>;
      numberOfDaysPerDepartment: number;
    }>;
    numberOfDaysPerCompany: number;
  }>;
}

export interface EmployeeLeaveTakenReportData {
  employeeName: string;
  employeeNumber: string;
  companyName: string;
  reportPeriod: string;
  leaveTypes: Array<{
    id: number;
    code?: string;
    name?: string;
    leavePackages: Array<{
      id: number;
      name: string;
      code: string;
      daysUsed: number;
      daysApprovedButNotUsed: number;
      daysPendingApproval: number;
      daysAvailable: number;
    }>;
  }>;
}

export interface LeaveBalanceReportData {
  companyName: string;
  reportPeriod: string;
  employees: Array<{
    employee: {
      id: number;
      employeeNumber: string;
      name: string;
    };
    leaveTypes: Array<{
      id: number;
      code?: string;
      name?: string;
      leavePackages: Array<{
        id: number;
        code?: string;
        name?: string;
        remainingLeaveDays: number;
      }>;
    }>;
  }>;
}

export class PdfGenerationService {
  private static compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  private static getCompiledTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (!this.compiledTemplates.has(templateName)) {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(templateContent);
      this.compiledTemplates.set(templateName, compiledTemplate);
    }
    return this.compiledTemplates.get(templateName)!;
  }

  private static async generatePdfFromHtml(html: string): Promise<Buffer> {
    let browser;
    try {
      // Configure chromium for different environments
      const isDev = process.env.NODE_ENV === 'development';
      
      const launchOptions: any = {
        headless: true,
        defaultViewport: { width: 1280, height: 720 },
        protocolTimeout: 300000, // 300 seconds (5 minutes) timeout for network operations
        timeout: 300000, // 300 seconds browser launch timeout
        args: isDev ? [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ] : [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-javascript', // Skip JS if not needed
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ],
      };

      // Set executable path for production
      //if (!isDev) {
      //  launchOptions.executablePath = await chromium.executablePath();
      //  logger.info('Chromium executable path:', launchOptions.executablePath);
      //  logger.info('Chromium executable exists:', fs.existsSync(launchOptions.executablePath));
      //}

      browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();
      
      // Set page timeout to 300 seconds for all operations
      page.setDefaultTimeout(300000);
      page.setDefaultNavigationTimeout(300000);
      
      // Set content and wait for it to load
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 300000 // 300 seconds timeout for content loading
      });

      // Generate PDF with professional settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: true,
        timeout: 300000 // 300 seconds timeout for PDF generation
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('Error generating PDF from HTML:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  static async generateAnnouncementReadEventsPdf(
    announcementData: {
      announcementTitle: string;
      publishDate: string;
      companyName: string;
      totalEmployeesInCompany?: number;
      employees: Array<{
        name: string;
        jobTitle: string;
        department?: string;
      }>;
    }
  ): Promise<PdfGenerationResult> {
    try {
      const template = this.getCompiledTemplate('announcement-read-events');
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const employeesWithRowNumbers = announcementData.employees.map((emp, index) => ({
        ...emp,
        rowNumber: index + 1
      }));

      const uniqueDepartments = new Set(announcementData.employees.map(e => e.department?.trim()).filter(dept => dept));
      const totalReadersCount = announcementData.employees.length;
      const totalEmployeesInCompany = announcementData.totalEmployeesInCompany || totalReadersCount;
      
      // Calculate read percentage based on total employees in company
      const readPercentage = totalEmployeesInCompany > 0 
        ? Math.round((totalReadersCount / totalEmployeesInCompany) * 100)
        : 0;

      const templateData = {
        ...announcementData,
        employees: employeesWithRowNumbers,
        currentDate,
        totalReaders: totalReadersCount,
        totalEmployeesInCompany,
        totalDepartments: uniqueDepartments.size,
        readPercentage
      };

      const html = template(templateData);

      // Generate PDF from HTML
      const pdfBuffer = await this.generatePdfFromHtml(html);
      
      const s3Service = S3Component.getInstance();
      const fileName = `reports/announcements/${uuidv4()}-announcement-read-events.pdf`;
      const bucketName = process.env.S3_BUCKET_NAME || 'hr-reports';

      const uploadResult = await s3Service.uploadFile(
        bucketName,
        pdfBuffer,
        fileName,
        'application/pdf'
      );

      const presignedUrl = await s3Service.generatePresignedUrl(
        bucketName,
        fileName,
        3600
      );

      logger.info(`Announcement read events PDF generated and uploaded: ${fileName}`);

      return {
        presignedUrl,
        s3Key: fileName,
        bucket: bucketName
      };
    } catch (error) {
      logger.error('Error generating announcement read events PDF:', error);
      throw error;
    }
  }

  static async generateLeavesTakenReportPdf(
    reportData: LeaveTakenReportData
  ): Promise<PdfGenerationResult> {
    try {
      const template = this.getCompiledTemplate('leaves-taken-report');
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calculate summary statistics
      const totalLeaveTypes = reportData.reportData.length;
      const allDepartments = new Set<number>();
      const allEmployees = new Set<number>();
      let totalDays = 0;

      reportData.reportData.forEach(leaveTypeData => {
        totalDays += leaveTypeData.numberOfDaysPerCompany;
        leaveTypeData.department.forEach(dept => {
          if (dept.id !== undefined) {
            allDepartments.add(dept.id);
          }
          dept.employees.forEach(emp => {
            allEmployees.add(emp.id);
          });
        });
      });

      const templateData = {
        ...reportData,
        currentDate,
        totalLeaveTypes,
        totalDepartments: allDepartments.size,
        totalEmployees: allEmployees.size,
        totalDays
      };

      const html = template(templateData);
      
      // Generate PDF from HTML
      const pdfBuffer = await this.generatePdfFromHtml(html);
      
      const s3Service = S3Component.getInstance();
      const fileName = `reports/leaves-taken/${uuidv4()}-leaves-taken-report.pdf`;
      const bucketName = process.env.S3_BUCKET_NAME || 'hr-reports';

      const uploadResult = await s3Service.uploadFile(
        bucketName,
        pdfBuffer,
        fileName,
        'application/pdf'
      );

      const presignedUrl = await s3Service.generatePresignedUrl(
        bucketName,
        fileName,
        3600
      );

      logger.info(`Leaves taken PDF report generated and uploaded: ${fileName}`);

      return {
        presignedUrl,
        s3Key: fileName,
        bucket: bucketName
      };
    } catch (error) {
      logger.error('Error generating leaves taken report PDF:', error);
      throw error;
    }
  }

  static async generateEmployeeLeaveTakenReportPdf(
    reportData: EmployeeLeaveTakenReportData
  ): Promise<PdfGenerationResult> {
    try {
      const template = this.getCompiledTemplate('employee-leave-taken-report');
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calculate summary statistics and enhance data
      let totalPackages = 0;
      let grandTotalUsed = 0;
      let grandTotalApproved = 0;
      let grandTotalPending = 0;
      let grandTotalAvailable = 0;

      const enhancedLeaveTypes = reportData.leaveTypes.map(leaveType => {
        let totalUsed = 0;
        let totalApproved = 0;
        let totalPending = 0;
        let totalAvailable = 0;

        leaveType.leavePackages.forEach(pkg => {
          totalUsed += pkg.daysUsed;
          totalApproved += pkg.daysApprovedButNotUsed;
          totalPending += pkg.daysPendingApproval;
          totalAvailable += pkg.daysAvailable;
          totalPackages++;
        });

        grandTotalUsed += totalUsed;
        grandTotalApproved += totalApproved;
        grandTotalPending += totalPending;
        grandTotalAvailable += totalAvailable;

        return {
          ...leaveType,
          totalUsed,
          totalApproved,
          totalPending,
          totalAvailable,
          showTotals: leaveType.leavePackages.length > 1
        };
      });

      const templateData = {
        ...reportData,
        leaveTypes: enhancedLeaveTypes,
        currentDate,
        totalLeaveTypes: reportData.leaveTypes.length,
        totalPackages,
        totalUsedDays: grandTotalUsed,
        totalAvailableDays: grandTotalAvailable,
        grandTotalUsed,
        grandTotalApproved,
        grandTotalPending,
        grandTotalAvailable
      };

      const html = template(templateData);
      
      // Generate PDF from HTML
      const pdfBuffer = await this.generatePdfFromHtml(html);
      
      const s3Service = S3Component.getInstance();
      const fileName = `reports/employee-leaves/${uuidv4()}-employee-leave-taken-report.pdf`;
      const bucketName = process.env.S3_BUCKET_NAME || 'hr-reports';

      const uploadResult = await s3Service.uploadFile(
        bucketName,
        pdfBuffer,
        fileName,
        'application/pdf'
      );

      const presignedUrl = await s3Service.generatePresignedUrl(
        bucketName,
        fileName,
        30
      );

      logger.info(`Employee leave taken PDF report generated and uploaded: ${fileName}`);

      return {
        presignedUrl,
        s3Key: fileName,
        bucket: bucketName
      };
    } catch (error) {
      logger.error('Error generating employee leave taken report PDF:', error);
      throw error;
    }
  }

  static async generateLeaveBalanceReportPdf(
    reportData: LeaveBalanceReportData
  ): Promise<PdfGenerationResult> {
    try {
      const template = this.getCompiledTemplate('leave-balance-report');
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Calculate summary statistics and enhance data
      let totalPackages = 0;
      let totalRemainingDays = 0;
      const allLeaveTypes = new Set<number>();

      const enhancedEmployees = reportData.employees.map(employeeData => {
        let employeeTotalRemainingDays = 0;

        const enhancedLeaveTypes = employeeData.leaveTypes.map(leaveType => {
          allLeaveTypes.add(leaveType.id);
          
          const enhancedPackages = leaveType.leavePackages.map(pkg => {
            totalPackages++;
            totalRemainingDays += pkg.remainingLeaveDays;
            employeeTotalRemainingDays += pkg.remainingLeaveDays;

            // Add color coding flags based on remaining days
            return {
              ...pkg,
              remainingLeaveDaysHigh: pkg.remainingLeaveDays >= 15,
              remainingLeaveDaysMedium: pkg.remainingLeaveDays >= 5 && pkg.remainingLeaveDays < 15
            };
          });

          return {
            ...leaveType,
            leavePackages: enhancedPackages
          };
        });

        return {
          ...employeeData,
          leaveTypes: enhancedLeaveTypes,
          totalRemainingDays: employeeTotalRemainingDays
        };
      });

      const templateData = {
        ...reportData,
        employees: enhancedEmployees,
        currentDate,
        totalEmployees: reportData.employees.length,
        totalLeaveTypes: allLeaveTypes.size,
        totalPackages,
        totalRemainingDays
      };

      const html = template(templateData);
      
      // Generate PDF from HTML
      const pdfBuffer = await this.generatePdfFromHtml(html);
      
      const s3Service = S3Component.getInstance();
      const fileName = `reports/leave-balance/${uuidv4()}-leave-balance-report.pdf`;
      const bucketName = process.env.S3_BUCKET_NAME || 'hr-reports';

      const uploadResult = await s3Service.uploadFile(
        bucketName,
        pdfBuffer,
        fileName,
        'application/pdf'
      );

      const presignedUrl = await s3Service.generatePresignedUrl(
        bucketName,
        fileName,
        3600
      );

      logger.info(`Leave balance PDF report generated and uploaded: ${fileName}`);

      return {
        presignedUrl,
        s3Key: fileName,
        bucket: bucketName
      };
    } catch (error) {
      logger.error('Error generating leave balance report PDF:', error);
      throw error;
    }
  }

  static async generateHtmlFromTemplate(
    templateName: string,
    data: any
  ): Promise<string> {
    try {
      const template = this.getCompiledTemplate(templateName);
      return template(data);
    } catch (error) {
      logger.error(`Error generating HTML from template ${templateName}:`, error);
      throw error;
    }
  }
}

export default PdfGenerationService;