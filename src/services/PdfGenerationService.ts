import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { rootLogger as logger } from '../utils/logger';
import S3Component from '../components/s3.component';
import { v4 as uuidv4 } from 'uuid';

export interface PdfGenerationResult {
  presignedUrl: string;
  s3Key: string;
  bucket: string;
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

  static async generateAnnouncementReadEventsPdf(
    announcementData: {
      announcementTitle: string;
      publishDate: string;
      companyName: string;
      employees: Array<{
        name: string;
        jobTitle: string;
        department: string;
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

      const uniqueDepartments = new Set(announcementData.employees.map(e => e.department));
      const totalEmployees = announcementData.employees.length;

      const templateData = {
        ...announcementData,
        employees: employeesWithRowNumbers,
        currentDate,
        totalReaders: totalEmployees,
        totalDepartments: uniqueDepartments.size,
        readPercentage: 100
      };

      const html = template(templateData);

      const htmlBuffer = Buffer.from(html, 'utf-8');
      
      const s3Service = S3Component.getInstance();
      const fileName = `reports/announcements/${uuidv4()}-announcement-read-events.html`;
      const bucketName = process.env.S3_BUCKET_NAME || 'hr-reports';

      const uploadResult = await s3Service.uploadFile(
        bucketName,
        htmlBuffer,
        fileName,
        'text/html'
      );

      const presignedUrl = await s3Service.generatePresignedUrl(
        bucketName,
        fileName,
        15
      );

      logger.info(`PDF report generated and uploaded: ${fileName}`);

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