import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';

interface EmailContext {
  [key: string]: string;
}

interface TransportConfig {
  port: number;
  host: string;
  auth: {
    user: string;
    pass: string;
  };
  secure: boolean;
}

interface EmailOptions {
  from: {
    name: string;
    address: string;
  };
  to: string | string[];
  subject: string;
  html: string;
}

const headerTemplate: string = fs.readFileSync(
  path.join(process.cwd(), '/src/utils/templates/header.hbs'),
  'utf8'
);
const footerTemplate: string = fs.readFileSync(
  path.join(process.cwd(), '/src/utils/templates/footer.hbs'),
  'utf8'
);

handlebars.registerPartial('header', headerTemplate);
handlebars.registerPartial('footer', footerTemplate);

export const sendEmail = async (
  email: string | string[],
  subject: string,
  template: string,
  context: EmailContext
): Promise<nodemailer.SentMessageInfo> => {
  try {
    const templateFile: string = fs.readFileSync(
      path.join(process.cwd(), `//src/utils/templates/${template}.hbs`),
      'utf8'
    );

    const templateData: handlebars.TemplateDelegate =
      handlebars.compile(templateFile);

    const transportConfig: TransportConfig = {
      port: 465,
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.EMAIL || '',
        pass: process.env.PASS || '',
      },
      secure: true,
    };

    const transporter = nodemailer.createTransport(transportConfig);

    await transporter.verify();
    console.log('Server is ready to take our messages');

    const emailOptions: EmailOptions = {
      from: {
        name: '',
        address: process.env.EMAIL || '',
      },
      to: typeof email === 'string' ? email : email,
      subject: subject,
      html: templateData(context),
    };

    const info = await transporter.sendMail(emailOptions);

    console.log(info, 'Email sent successfully');
    return info;
  } catch (error) {
    console.error(error, 'Failed to send email');
    throw error;
  }
};
