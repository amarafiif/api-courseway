require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const ejs = require("ejs");

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_SENDER_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

// Set credentials by refresh token
if (GOOGLE_REFRESH_TOKEN) {
	oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
}

const createTransporter = async () => {
	if (GOOGLE_REFRESH_TOKEN) {
		const accessToken = await oauth2Client.getAccessToken();

		return nodemailer.createTransport({
			service: "gmail",
			auth: {
				type: "OAuth2",
				user: GOOGLE_SENDER_EMAIL,
				clientId: GOOGLE_CLIENT_ID,
				clientSecret: GOOGLE_CLIENT_SECRET,
				refreshToken: GOOGLE_REFRESH_TOKEN,
				accessToken: accessToken.token,
			},
		});
	} else {
		return nodemailer.createTransport({
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: SMTP_PORT == 465, // true for 465, false for other ports
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS,
			},
		});
	}
};

module.exports = {
	sendEmail: async (to, subject, html) => {
		try {
			const transporter = await createTransporter();
			const mailOptions = {
				from: GOOGLE_SENDER_EMAIL || SMTP_USER, // Sender address
				to: to, 
				subject: subject, 
				html: html,
			};

			const result = await transporter.sendMail(mailOptions);
			console.log("Email sent: %s", result.messageId);
			return result;
		} catch (error) {
			console.error("Error sending email:", error);
			throw error;
		}
	},

	getHtml: (fileName, data) => {
		return new Promise((resolve, reject) => {
			const path = `${__dirname}/../views/${fileName}`;
			ejs.renderFile(path, data, (err, str) => {
				if (err) {
					return reject(err);
				}
				return resolve(str);
			});
		});
	},
};