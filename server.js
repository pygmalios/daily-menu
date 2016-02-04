'use strict';

var CANTEEN = process.env.CANTEEN || '';
var TUTUM_API_KEY = process.env.TUTUM_API_KEY || '';

var HIPCHAT_ROOM = process.env.HIPCHAT_ROOM || '';
var HIPCHAT_API_KEY = process.env.HIPCHAT_API_KEY || '';

var date = new Date();
var CANTEEN_WEBPAGE = 'https://www.jedalen.stuba.sk/webkredit/Tisk/ObjednavaniJidlenicek.aspx?dateFrom=' + date.toISOString().split('T')[0] + '&dateTo=' + date.toISOString().split('T')[0] + '&canteen=' + CANTEEN;

var jsdom = require('jsdom');
var HipChatClient = require('hipchat-client');
var hipchat = new HipChatClient(HIPCHAT_API_KEY);

var sendMessage = function(message){

    hipchat.api.rooms.message({
        room_id: HIPCHAT_ROOM,
        from: 'Daily menu',
        color: 'gray',
        message: message,
        notify: 1
    }, function (err, res) {
        if (err) {
            console.log(err);
        }
        console.log(res);
    });
};

var fetchMenu = function(cb){
    jsdom.env(
        CANTEEN_WEBPAGE,
        ['http://code.jquery.com/jquery.js'],
        function (err, window) {
            var text = window.$('center').text();
            console.log(text);
            return cb(err, text);
        }
    );
};

var breakfastNotification = require('cron').CronJob;
new breakfastNotification('0 0 8 * * *', function(){
    fetchMenu(function(err, text){
        sendMessage(text);
    });
}, null, true, 'Europe/Bratislava');

var lunchNotification = require('cron').CronJob;
new lunchNotification('0 0 12 * * *', function(){
    fetchMenu(function(err, text){
        sendMessage(text);
    });
}, null, true, 'Europe/Bratislava');




