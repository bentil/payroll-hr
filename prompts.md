
1- Announcement event details PDF report

I need a version of the '/announcements/:id/read-events/details' that generates and returns a PDF containing the following data. After the report header showing the announcement title and publish date, there should be a space followed by a table containing the list of employees who have read the announcement (per the logic in getReadEventDetails in announcement.service.ts):

Announcement: Title field of announcement object
Time: publishDate of announcement object

Employee, Job Title, Department

For Employeee column, concatenate the first name and last name of each Employee
For job title column, use the name field of the job title
For department column, use the name field of the department column

The annoucement ID is passed in the path in the API call.

2- 
