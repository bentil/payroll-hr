import PDFDocument from 'pdfkit';
import { ReadEventSummmaryDto } from '../domain/dto/announcement-read-event.dto';
import { AnnouncementDto } from '../domain/dto/announcement.dto';

export interface AnnouncementReadEventPDFData {
  announcement: AnnouncementDto;
  readEvents: ReadEventSummmaryDto[];
}

export async function generateAnnouncementReadEventPDF(
  data: AnnouncementReadEventPDFData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        bufferPages: true
      });
      
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Announcement Read Event Report', { align: 'center' });
      doc.moveDown();

      // Announcement details
      doc.fontSize(14).text(`Announcement: ${data.announcement.title}`, { align: 'left' });
      doc.fontSize(12).text(`Time: ${new Date(data.announcement.publishDate).toLocaleString()}`, { align: 'left' });
      doc.moveDown(2);

      // Table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 350;
      const col4 = 450;
      
      // Draw table header background
      doc.rect(col1 - 5, tableTop - 5, 500, 20)
         .fillAndStroke('#f0f0f0', '#cccccc');
      
      // Table headers
      doc.fillColor('black')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Employee', col1, tableTop)
         .text('Job Title', col2, tableTop)
         .text('Department', col3, tableTop);
      
      doc.font('Helvetica');
      
      // Table rows
      let yPosition = tableTop + 25;
      const lineHeight = 20;
      
      data.readEvents.forEach((event, index) => {
        // Add new page if needed
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
          
          // Redraw header on new page
          doc.rect(col1 - 5, yPosition - 5, 500, 20)
             .fillAndStroke('#f0f0f0', '#cccccc');
          
          doc.fillColor('black')
             .fontSize(12)
             .font('Helvetica-Bold')
             .text('Employee', col1, yPosition)
             .text('Job Title', col2, yPosition)
             .text('Department', col3, yPosition);
          
          doc.font('Helvetica');
          yPosition += 25;
        }
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(col1 - 5, yPosition - 5, 500, lineHeight)
             .fill('#f9f9f9');
          doc.fillColor('black');
        }
        
        // Row data
        doc.fontSize(10);
        doc.text(event.employee.fullName || '-', col1, yPosition, { width: 140 });
        doc.text(event.employee.jobTitle?.name || '-', col2, yPosition, { width: 140 });
        doc.text(event.employee.department?.name || '-', col3, yPosition, { width: 140 });
        
        // Draw horizontal line
        doc.moveTo(col1 - 5, yPosition + lineHeight - 5)
           .lineTo(545, yPosition + lineHeight - 5)
           .stroke('#e0e0e0');
        
        yPosition += lineHeight;
      });

      // Footer
      doc.fontSize(8)
         .fillColor('#666666')
         .text(`Generated on ${new Date().toLocaleString()}`, 50, 750, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}