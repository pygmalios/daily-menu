'use strict';

var STU_CANTEEN = process.env.STU_CANTEEN || '';
var STU_CANTEEN_NAME = process.env.STU_CANTEEN_NAME || '';
var ZOMATO_CANTEEN = process.env.ZOMATO_CANTEEN || '';
var ZOMATO_CANTEEN_NAME = process.env.ZOMATO_CANTEEN_NAME || '';
var HIPCHAT_ROOM = process.env.HIPCHAT_ROOM || '';
var HIPCHAT_API_KEY = process.env.HIPCHAT_API_KEY || '';

var jsdom = require('jsdom');
var HipChatClient = require('hipchat-client');
var hipchat = new HipChatClient(HIPCHAT_API_KEY);

var filterMessage = function(message, from, to) {
    var msgs = [];
    if (from && to) {
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
    }
    else {
        var ms = message.split('\n');
        ms.forEach(function(m){
            if (m.trim() !== '') {
                msgs.push(m.trim());
            }
        });
    }

    return msgs;
};

var sendMessage = function(canteenName, message, from, to){

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
        from: canteenName,
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
    var date = new Date();
    var CANTEEN_WEBPAGE = 'https://www.jedalen.stuba.sk/webkredit/Tisk/ObjednavaniJidlenicek.aspx?dateFrom=' + date.toISOString().split('T')[0] + '&dateTo=' + date.toISOString().split('T')[0] + '&canteen=' + STU_CANTEEN;
    console.log(CANTEEN_WEBPAGE);
    
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

var fetchMenuZomato = function(cb){
    var CANTEEN_WEBPAGE = 'https://www.zomato.com/bratislava/' + ZOMATO_CANTEEN + '/menu#daily';
    console.log(CANTEEN_WEBPAGE);

    jsdom.env(
        CANTEEN_WEBPAGE,
        ['http://code.jquery.com/jquery.js'],
        function (err, window) {
            var text = window.$('.tmi-group').text();
            console.log(text);
            return cb(err, text);
        }
    );
};

var breakfastNotification = require('cron').CronJob;
new breakfastNotification('0 0 7 * * *', function(){
    fetchMenu(function(err, text){
        sendMessage(STU_CANTEEN_NAME, text, 'Raňajky', 'Obed');
    });
}, null, true, 'Europe/Bratislava');

var lunchNotification = require('cron').CronJob;
new lunchNotification('0 0 11 * * *', function(){
    fetchMenu(function(err, text){
        sendMessage(STU_CANTEEN_NAME, text, 'Obed', 'Večera');
    });

    fetchMenuZomato(function(err, text){
        sendMessage(ZOMATO_CANTEEN_NAME, text);
    });
}, null, true, 'Europe/Bratislava');

var dinnerNotification = require('cron').CronJob;
new dinnerNotification('0 0 16 * * *', function(){
    fetchMenu(function(err, text){
        sendMessage(STU_CANTEEN_NAME, text, 'Večera', 'KONIEC');
    });
}, null, true, 'Europe/Bratislava');
