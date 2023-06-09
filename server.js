const express = require('express');
var app = express();
var bodyParser = require('body-parser');
const AccountModel = require('./models/account');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.post('/register', (req, res, next) => {
    var username = req.body.username;
    var password = req.body.password;

    AccountModel.create({
        username: username,
        password: password
    })
        .then(data => {
            res.json("Register successfully");
        })
        .catch(err => {
            res.status(500).json('Register failed');
        })
});

// app.post('/login', (req, res, next) => {
//     var username = req.body.username;
//     var password = req.body.password;

//     AccountModel.findOne({
//         username: username,
//         password: password
//     })
//         .then(data => {
//             if (data) {
//                 res.json('Login successfully');
//             } else {
//                 res.json('Wrong password or username');
//             }
//         })
//         .catch(err => {
//             res.status(500).json('Some thing wrong with server');
//         })
// });

// GET LOGIN
app.get('/login', (req, res, next) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// POST LOGIN
app.post('/login', (req, res, next) => {
    var username = req.body.username;
    var password = req.body.password;

    AccountModel.findOne({
        username: username,
        password: password
    })
        .then(data => {
            if (data) {
                var token = jwt.sign({
                    _id: data._id
                }, 'mk');
                return res.json({
                    message: 'Login successsfully',
                    token: token,
                });
            } else {
                return res.json('Login failed');
            }
        })
        .catch(err => {
            res.status(500).json('Error from server');
        });
});

app.get('/private', (req, res, next) => {
    try {
        var token = req.cookies.token;
        var result = jwt.verify(token, 'mk');
        if (result) {
            next();
        }
    } catch (err) {
        return res.redirect('/login');
    }

}, (req, res, next) => {
    res.json('Welcome')
});

app.get('/', (req, res, next) => {
    res.json('Home');
});


const PAGE_SIZE = 3;
//pagination in mongodb with skip and limit
app.get('/user', (req, res, next) => {
    let page = req.query.page;
    if (page) {
        if (page < 1) page = 1;
        let start = (page - 1) * PAGE_SIZE;
        AccountModel.find({})
            .skip(start)
            .limit(PAGE_SIZE)
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json('Error!');
            });
    } else {
        AccountModel.find({})
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.json('Error');
            });
    }
});


// luyện tập phân quyền

var chechLogin = (req, res, next) => {
    try {
        var token = req.cookies.token;
        var idUser = jwt.verify(token, 'mk');
        AccountModel.findOne({
            _id: idUser
        })
            .then(data => {
                if (data) {
                    req.data = data;
                    next();
                } else {
                    res.json('NOT PERMISSION');
                }
            })
            .catch(err => {

            });
    } catch (error) {
        res.status(500).json('Token is invalid')
    }
}

var checkStudent = (req, res, next) => {
    var role = req.data.role
    if (role === 'student' || role === 'teacher' || role === 'manager') {
        next();
    } else {
        res.json('NOT PERMISSION');
    }
}

var checkTeacher = (req, res, next) => {
    if (req.data.role === 'teacher' || req.data.role === 'manager') {
        next();
    } else {
        res.json('NOT PERMISSION');
    }
}

var checkManager = (req, res, next) => {
    if (req.data.role === 'manager') {
        next();
    } else {
        res.json('NOT PERMISSION');
    }
}

app.get('/task', chechLogin, checkStudent, (req, res, next) => {
    res.json('Task');
});

app.get('/student', chechLogin, checkTeacher, (req, res, next) => {
    next();
}, (req, res, next) => {
    res.json('STUDENT');
});

app.get('/teacher', chechLogin, checkManager, (req, res, next) => {
    next();
}, (req, res, next) => {
    res.json('TEACHER');
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});