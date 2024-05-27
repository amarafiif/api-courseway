const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const nodemailer = require("../libs/nodemailer");
const otpGenerator = require("otp-generator");

module.exports = {
	createUpdateotp: async (account_id, nama, email, res) => {
		// Menambahkan respon sebagai argumen
		try {
			//generate otp
			const otpValue = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
			let existingOTP = null; // Deklarasi existingOTP
			existingOTP = await prisma.otp.findUnique({
				where: {
					account_id, // Cari entri OTP berdasarkan account_id
				},
			});

			if (existingOTP) {
				// Jika entri OTP sudah ada, lakukan pembaruan
				await prisma.otp.update({
					where: {
						account_id: account_id,
					},
					data: {
						otp: otpValue, // Update nilai OTP yang baru
					},
				});
			} else {
				// Jika entri OTP belum ada, buat entri baru
				existingOTP = await prisma.otp.create({
					data: {
						otp: otpValue,
						account: {
							connect: {
								account_id: account_id, // Hubungkan dengan account yang baru saja dibuat
							},
						},
					},
				});
			}

			// Kirim OTP ke email pengguna
			const html = `<div style="font-family: Arial, sans-serif; text-align: center; color: #333;">			
                            <h2 style="color: #333;">Welcome to CourseWay!</h2>
                            <p style="color: #555; line-height: 1.6;">
                                Hi ${nama}, Thank you for choosing CourseWay as your platform to explore and share knowledge. To complete your registration and unlock the power of knowledge, please verify your email by entering the OTP below:
                            </p>
                        
                            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-bottom: 10px; color: #333;">Your One-Time Passcode (OTP):</h3>
                                <p style="font-size: 24px; color: #333; padding: 10px; background-color: #fff; border-radius: 5px;">${otpValue}</p>
                            </div>
                        
                            <p style="line-height: 1.6; color: #888;">
                                If you didn't request this OTP, you can safely ignore this email. Otherwise, welcome aboard! Explore the vast world of knowledge with CourseWay.
                            </p>
                        
                            <p style="color: #555; margin-top: 30px;">
                                Best regards,<br/>
                                The CourseWay Team
                            </p>
                        </div>`;
			await nodemailer.sendEmail(email, "🔔 One-Time Password (OTP)", html);

			//menghapus otp setelah 5 menit dan belum diverifikasi
			setTimeout(async (req, res, next) => {
				try {
					//         //mencari otp yang sesuai dengan id account dan belum diverifikasi
					const otpEntry = await prisma.account.findUnique({
						where: {
							account_id: account_id,
							is_verified: false,
						},
					});
					if (otpEntry) {
						//hapus otp jika ditemukan
						await prisma.otp.update({
							where: {
								account_id: otpEntry.account_id,
							},
							data: {
								otp: null,
							},
						});

						console.log(`OTP entry for account ${account_id} successfully deleted.`);
					} else {
						console.log(`No unverified OTP entry found for user ${account_id}.`);
					}
				} catch (err) {
					console.error("Error while deleting OTP : ", err.message);
				}
			}, 300000);

			// // Mengembalikan existingOTP dalam respons HTTP 200
			// return res.status(200).json({
			//     status: true,
			//     message: 'Proses OTP berhasil',
			//     data: existingOTP
			// });
		} catch (err) {
			console.error("error anda pada otp", err.message);
		}
	},
};
