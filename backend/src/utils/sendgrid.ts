import config from '@config/index';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(config.sendGridApiKey);
export default sgMail;
