'use strict';

var CANTEEN = process.env.CANTEEN || '';
var HIPCHAT_ROOM = process.env.HIPCHAT_ROOM || '';
var HIPCHAT_API_KEY = process.env.HIPCHAT_API_KEY || '';

var date = new Date();
var CANTEEN_WEBPAGE = 'https://www.jedalen.stuba.sk/webkredit/Tisk/ObjednavaniJidlenicek.aspx?dateFrom=' + date.toISOString().split('T')[0] + '&dateTo=' + date.toISOString().split('T')[0] + '&canteen=' + CANTEEN;

var jsdom = require('jsdom');
var HipChatClient = require('hipchat-client');
var hipchat = new HipChatClient(HIPCHAT_API_KEY);

var filterMessage = function(message, from, to) {
    var msgs = [];
    var index = 0;
    var mayPush = false;
    var lines = message.split('\n');
    lines.forEach(function(line){
        line = line.trim();
        if (line && line !== 'AltJedlo') {
            if (index > 0) {
                if (line.indexOf(from) > -1) {
                    mayPush = true;
                }

                if (line.indexOf(to) > -1) {
                    mayPush = false;
                }

                if (mayPush) {
                    msgs.push(line);
                }
            }
            index++;
        }
    });

    return msgs;
};

var sendMessage = function(message, from, to){

    var messages = filterMessage(message, from, to);

    var string = '<ul>';
    messages.forEach(function(line){
        string += '<li>';
        string += line;
        string += '</li>';
    });
    string += '</ul>';

    console.log(messages);
    hipchat.api.rooms.message({
        room_id: HIPCHAT_ROOM,
        from: 'Daily menu',
        color: 'gray',
        message: string,
        notify: 1
    }, function (err, res) {
        if (err) {
            console.log(err);
        }
        console.log(res, string);
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
        sendMessage(text, 'Raňajky', 'Obed');
    });
}, null, true, 'Europe/Bratislava');

var lunchNotification = require('cron').CronJob;
new lunchNotification('0 0 12 * * *', function(){
    fetchMenu(function(err, text){
        sendMessage(text, 'Obed', 'Večera');
    });
}, null, true, 'Europe/Bratislava');

var dinnerNotification = require('cron').CronJob;
new dinnerNotification('0 0 17 * * *', function(){
    fetchMenu(function(err, text){
        sendMessage(text, 'Večera', 'KONIEC');
    });
}, null, true, 'Europe/Bratislava');
