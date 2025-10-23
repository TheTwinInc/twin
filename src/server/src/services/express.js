(function () {
    const express = require('express');
    const cors = require('cors');

    module.exports = function (app, config) {
        app.enable('trust proxy');
        app.use(cors());
        app.use(express.urlencoded({ extended: false }))
        app.use(express.json())
    };
}());
