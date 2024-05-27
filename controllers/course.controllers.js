const prisma = require('../libs/prisma')
const { getPagination } = require('../helper/index');
const imagekit = require('../libs/imagekit');
const path = require('path');

const getAllCourse = async (req, res, next) => {
    try {
        let { limit = 10, page = 1, search, category_ids, sort, order="asc", level } = req.query;
        limit = Number(limit);
        page = Number(page);
        
        let conditions = {};
        let orderBy = {};
        
        if (search) {
            conditions.title = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (category_ids) {
            const kategoriIds = Array.isArray(category_ids) ? category_ids.map(id => parseInt(id, 10)) : [parseInt(category_ids, 10)];
            conditions.kategori_id = {
                in: kategoriIds.filter(id => !isNaN(id)), // Filter out NaN values
            };
        }

        if (level) {
            const levelList = Array.isArray(level) ? level : [level];
            conditions.level = {
                in: levelList,
            };
        }

        if (sort && order) {
            //skip langkah jika ingin mengsorting berdasarkan rating
            if (sort && order && sort.toLowerCase() === 'rating') {
                
            }else{
                orderBy = sort && order ? { [sort]: order } : undefined;
            }
        }
        
        const { _count } = await prisma.course.aggregate({
            where:conditions,
            _count: { course_id: true },
        });

        let course = await prisma.course.findMany({
            where: conditions,
            orderBy: orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: {
                course_id: true,
                title: true,
                kode_kelas: true,
                kategori_id: true,
                premium: true,
                harga: true,
                level: true,
                is_visible: true,
                Kategori: {
                    select: {
                        title: true,
                    },
                },
                Mentor: {
                    select: {
                        name: true,
                    },
                },
                Rating: {
                    select: {
                        skor: true,
                    },
                },
                Chapter: {
                    select: {
                      _count: {
                        select: {
                          Video: true,
                        },
                      },
                    },
                },
            },
        });

        // Menghitung rata-rata skor secara manual
        course.forEach((c) => {
            const totalSkor = c.Rating.reduce((acc, rating) => acc + rating.skor, 0);
            const avgSkor = c.Rating.length > 0 ? totalSkor / c.Rating.length : 0;
            c.avgRating = avgSkor;

            c.module = c.Chapter.reduce(
                (acc, chapter) => acc + chapter._count.Video,
                0
            );
        });

        // Mengurutkan berdasarkan rating jika diperlukan
        if (sort && order && sort.toLowerCase() === 'rating') {
            if (order.toLowerCase() === 'desc') {
                course.sort((a, b) => b.avgRating - a.avgRating);
            } else if (order.toLowerCase() === 'asc') {
                course.sort((a, b) => a.avgRating - b.avgRating);
            }
        }

        let pagination = getPagination(req, _count.course_id, page, limit);

        course.forEach(object=>{
            delete object['Rating']
            delete object['Chapter']
        })

        res.status(200).json({
            success: true,
            data: { pagination, course },
        });
    } catch (error) {
        next(error);
    }
};

const getCoursebyId = async(req,res,next)=>{
    try {
        let {course_id} = req.params
        //mengubah course_id menjadi tipe number/int
        let{account_id}= req.query
        course_id = parseInt(course_id,10)
        account_id = parseInt(account_id,10)
        let sudahBeli
        if(account_id){
            sudahBeli = !!(await prisma.user_course.findFirst({
                where: { account_id, course_id },
            }));
        }else{
            sudahBeli = false
        }
        console.log(sudahBeli)
        let progress
        if(sudahBeli){
            progress = await prisma.course_progress.findMany({
                where:{
                    account_id,
                    course_id
                },
                orderBy:{
                    video_id:'asc'
                }
            })
        }
        let course = await prisma.course.findUnique({ 
            where: {
                course_id
            },
            select:{
                course_id: true,
                title: true,
                deskripsi:true,
                kode_kelas:true,
                url_gc_tele:true,
                premium: true,
                harga: true,
                is_visible:true,
                url_image_preview:true,
                level:true,
                Kategori:{
                    select:{
                        title: true,
                    },
                },
                Mentor:{
                    select:{
                        name:true
                    }
                },
                Chapter:{
                    orderBy:{chapter_id:'asc'},
                    select:{
                        title:true,
                        chapter_id:true,
                        Video:{
                            orderBy:{video_id:'asc'},
                        }
                    }
                }
            }
        })
        //make an array consist of chapter_id in course variable
        let chapter_id = course.Chapter.map(chapter=>chapter.chapter_id)
        //search in prisma video database how many video consist in all chapter_id
        let module = await prisma.video.aggregate({
            select:{
                _count:{
                    select:{
                        video_id:true
                    }
                }
            },
            where:{
                chapter_id:{
                    in: chapter_id
                }
            }
        })
        console.log(module)
        if(!course) return res.json("Course isnt registered")
        // Mengambil informasi rating dari tabel Rating
        let ratings = await prisma.rating.findMany({
            where: {
                course_id,
            },
            select: {
                skor: true,
            },
        });

        // Menghitung rata-rata skor secara manual
        const totalSkor = ratings.reduce((acc, rating) => acc + rating.skor, 0);
        const avgSkor = ratings.length > 0 ? totalSkor / ratings.length : 0;

        // Menambahkan informasi rating ke objek course
        course.avgRating = avgSkor;
        course.module = module._count.video_id

        res.status(200).json({
        success:true,
        data:{sudahBeli,course, progress}
        })
    } catch (error) {
        next(error)
    }
}

const addCourse = async(req,res,next)=>{
    try {
        let { title, deskripsi, kode_kelas, harga, premium, level, name, kategori_id, category_title, mentor_id } = req.body;
        harga = Number(harga);
        premium = premium === "true";
        kategori_id = Number(kategori_id);
        mentor_id = Number(mentor_id);

        if (req.file) {
            // Jika ada file yang di-upload
            let strFile = req.file.buffer.toString('base64');
            let uploadedFile = await imagekit.upload({
                fileName: Date.now() + path.extname(req.file.originalname),
                file: strFile
            });
            url = uploadedFile.url; // Ambil URL gambar yang di-upload
        } else  {
            // Jika tidak ada file yang di-upload tetapi ada url_img_preview dalam permintaan
            url = null; 
        }

        let course = await prisma.course.create({
            data: {
                title,
                deskripsi,
                kode_kelas,
                url_image_preview: url, // URL gambar preview jika ada
                harga,
                premium,
                level,
                kategori_id,
                mentor_id
            },
            select: {
                course_id: true,
                title: true,
                harga: true,
                level: true,
                premium: true,
                kode_kelas: true,
                url_image_preview: true,
                Mentor: {
                    select: {
                        name: true 
                    }
                },
                Kategori: {
                    select: {
                        title: true 
                    }
                }
            }
        });

        let mentorCourse = await prisma.mentor_course.create({
            data : {
                mentor_id:mentor_id,
                course_id: course.course_id
            }
        })

        res.status(200).json({
            success:true,
            data:{course, mentorCourse}
        })
        
    } catch (error) {
        next(error)
    }
}

const deleteCoursebyId = async(req,res,next)=>{
    try {
        let {course_id} = req.params
        course_id = parseInt(course_id,10)
        let course = await prisma.course.delete({
            where:{
                course_id: course_id
            }
        })
        res.status(200).json({
            success:true,
            data:course
        })
    } catch (error) {
        next(error)
    }
}

const beliCourse = async(req,res,next)=>{
    try {
        let account = req.user;
        let { course_id , metode_pembayaran=""} = req.body;

        let course = await prisma.course.findUnique({
            where: {
                course_id,
            },
        });

        if (!course) return res.json('Course is not registered');

        let payment = await prisma.riwayat_Transaksi.create({
            data: {
                account_id: account.account_id,
                course_id,
                tanggal_pembayaran: new Date(Date.now()),
                metode_pembayaran,
                status: 'Menunggu Pembayaran',
            },
        });

        //create Notification
        let titleNotif = 'Un-Successful purchase course added!';
        let deskNotif = `Hii ${account.nama} you have courses that you haven't purchased yet, To get full access to the course, please complete the payment`;
        await prisma.notifikasi.create({
            data: {
              account_id: account.account_id,
              title: titleNotif,
              deskripsi: deskNotif,
            },
          });

        res.status(200).json({
            success: true,
            data: { payment },
        });
    } catch (error) {
        next(error);
    }

}

const updateCourse = async(req,res,next)=>{
    try {
        let { title, deskripsi, kode_kelas, harga, premium, level, name, kategori_id, category_title, mentor_id } = req.body;
        const { course_id } = req.params;
        harga = Number(harga);
        premium = premium === "true";
        kategori_id = Number(kategori_id);
        mentor_id = Number(mentor_id);

        // Periksa apakah course dengan course_id yang diberikan ada dalam database
        const existingCourse = await prisma.course.findUnique({
        where: {
          course_id: Number(course_id)
        }
        });
  
        // Validasi apakah course dengan course_id yang diberikan ada
        if (!existingCourse) {
            return res.status(404).json({
            status: false,
            message: 'Bad request!',
            err: 'Course not found',
            data: null,
            });
        }

        if (req.file) {
            // Jika ada file yang di-upload
            let strFile = req.file.buffer.toString('base64');
            let uploadedFile = await imagekit.upload({
                fileName: Date.now() + path.extname(req.file.originalname),
                file: strFile
            });
            url = uploadedFile.url; // Ambil URL gambar yang di-upload
        } else  {
            // Jika tidak ada file yang di-upload tetapi ada url_img_preview dalam permintaan
            url = null; 
        }

        let course = await prisma.course.update({
            where: {
                course_id: Number(course_id)
            },
            data: {
                title,
                deskripsi,
                kode_kelas,
                url_image_preview: url, // URL gambar preview jika ada
                harga,
                premium,
                level,
                kategori_id,
                mentor_id
            },
            select: {
                course_id: true,
                title: true,
                harga: true,
                level: true,
                premium: true,
                kode_kelas: true,
                url_image_preview: true,
                Mentor: {
                    select: {
                        name: true 
                    }
                },
                Kategori: {
                    select: {
                        title: true 
                    }
                }
            }
        });

        res.status(200).json({
            success:true,
            data:{course}
        })
        
    } catch (error) {
        next(error)
    }
}

const updateStatusCourse = async (req,res,next)=>{
    try {
        let { course_id } = req.params
        
        let isExist = await prisma.course.findUnique({where:{course_id}})
        if (!isExist){
            return res.status(400).json({
                status:false,
                message:'bad request!',
                err:'course id not found!',
                data: null
            })
        }

        let updatedCourse = await prisma.course.update({
            where:{ course_id },
            data:{ is_visible: false }
        })

        res.status(400).json({
            status:true,
            message:'success!',
            err: null,
            data: { updatedCourse }
        })

    } catch (err) {
        next(err)
    }
}

module.exports ={getAllCourse,getCoursebyId,addCourse,deleteCoursebyId,beliCourse, updateCourse, updateStatusCourse}
