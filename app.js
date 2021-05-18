const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('config');

const authRouter = require('./routes/auth');
const documentsRouter = require('./routes/documents');
const usersRouter = require('./routes/users');

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            blockAllMixedContent: [],
            fontSrc: ["'self'", 'https:', 'data:'],
            frameAncestors: ["'self'", 'https://accounts.google.com/'],
            frameSrc: ["'self'", 'https://accounts.google.com/'],
            imgSrc: ["'self'", 'data:'],
            objectSrc: ["'self'", 'blob:'],
            mediaSrc: ["'self'", 'blob:', 'data:'],
            styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
            upgradeInsecureRequests: [],
            connectSrc: ["'self'", 'https://test-api9.herokuapp.com'],
        },
    },
}));
app.use(compression());

app.use('/uploads/', express.static(path.join(__dirname, 'uploads')));
app.use('/documentation', express.static(path.join(__dirname, 'apidoc')));

app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    //res.locals.message = err.message;
    //res.locals.error = req.app.get('env') === 'development' ? err : {};

    // send the error
    res.status(err.status || 500);
    res.send(err.message);
});

module.exports = app;