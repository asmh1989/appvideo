var nodegrass = require('nodegrass');
var htmlparser = require("htmlparser2");
var async = require('async');
var category = require('./model/Category.js');
var latestVideo = require('./model/LatestRes.js');
var db = require('./model/db.js');
var videoDetailParser = require('./model/VideoDetailParser.js');
var categoryDetailParser = require('./model/CategoryDetailParser.js');
var settings = require('./config/Settings.js');

var ismenu = false;
var is_start = false;
var islatest_video = false;
var current_videos = 0;

var parser = new htmlparser.Parser({
    onopentag: function(name, attribs){
        if(name === "div" && attribs.class === "menu"){
            ismenu = true;
        }
        else if (name === 'div' && attribs.class === 'indexleft'){
            // console.log("hello latest movie");
            islatest_video = true;
        }
    },
    onattribute: function(name, value){
        if (ismenu && name === 'href') {
            category.datas.href = value;
            is_start = true;
        } else if(islatest_video){
            // console.log("onattribute : name = "+name+" value = "+value)
            if(name === 'href'){
                latestVideo.datas.href = value;
            } else if(name === 'src'){
                latestVideo.datas.img = value;
            } else if(name === 'alt'){
                latestVideo.datas.name = value;
                is_start = true;
            }
        }
    },
    onopentagname: function(tagname){
    },

    ontext: function(text){
        if(ismenu && is_start){
            category.datas.name = text;
        }

    },
    onclosetag: function(tagname){
        if(ismenu && is_start){
            is_start = false;
            category.add();
        } else if(islatest_video && is_start){
            is_start = false;
            latestVideo.add(current_videos);
        }

        if(tagname === "div"){
            ismenu = false;
        }
        else  if(tagname === 'ul'){
            if (islatest_video) {
                islatest_video = false;
                current_videos++;
            };
        }
    }
});

var startParse = function(p, data){
    p.write(data);
    p.end();
}

var everythingStart = function(website){
    nodegrass.get(website.address, function(data,status,headers){
        startParse(parser, data);

        db.saveCategory(category.unit, website.address, website.name);
        for (var i = 0; i < latestVideo.length; i++) {
            var m = latestVideo.get(i);
            db.saveLatest(m.content, m.name, website.name);
        };


        //开始下载最新的视频详细页
        for (var i = 0; i < latestVideo.length; i++) {
            var m = latestVideo.get(i);
            async.forEach(m.content, function(item, callback) {
                videoDetailParser(item.href, item.img, website);
            }, function(err) {
                console.log('videoDetailParser: err: ' + err);
            });
        }


        //开始下载分类数据
//        categoryDetailParser(category.unit[category.unit.length-1], website);

        async.forEach(category.unit, function(item, callback){
            if(item.href === '/'){
                console.log('首页不需要load了...');
            } else {
                categoryDetailParser(item, website);
            }
        }, function(err) {
            console.log('categoryDetailParser: err: ' + err);
        });


    },null,'gbk').on('error', function(e) {
            console.log("Got error: " + e.message);
        });
}


var main = function(){
    async.auto({
        loadData:function(callback){
            async.forEach(settings.website, function(item, callback2){
                console.log('start download website = '+item.address);
                everythingStart(item);

            }, function(err){

            });
        },
        disconnect:['loadData', function(callback){
//            db.disconnect();
//            callback('数据load完毕, 关闭数据库连接');
        }]

    }, function(err){
        console.log('err = '+err)
    });

    setTimeout(function(){  //每2小时
        var date = new Date();
        console.log(date.toString()+"...从新开始..");
        main();
    }, 1000*60*60*2);

}

//start
main();

