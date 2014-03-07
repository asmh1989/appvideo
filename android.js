var nodegrass = require('nodegrass');
var htmlparser = require("htmlparser2");
var async = require('async');
var category = require('./model/Category.js');
var latestVideo = require('./model/latestRes.js');
var db = require('./model/db.js');
var videoDetailParser = require('./model/VideoDetailParser.js');
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
        if (islatest_video) {
            // console.log("onopentagname: tagname = "+tagname)
        };
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
        // for (var i = 0; i < category.unit.length; i++) {
        //     var unit = category.unit[i];
        //     // console.log("name = "+unit.name+" href="+unit.href);
        // };

        // for (var i = 0; i < latestVideo.movies.content.length; i++) {
        //     var movies = latestVideo.movies.content[i];
        //     var tvs = latestVideo.tvs.content[i];
        //     var car = latestVideo.cartoon.content[i];
        //     var vars = latestVideo.variety.content[i];
        //     console.log("movices :"+movies.name+":"+movies.href+":"+movies.img+"\n"+
        //       "tvs :"+tvs.name+":"+tvs.href+":"+tvs.img+"\n"+
        //       "car :"+car.name+":"+car.href+":"+car.img+"\n"+
        //       "vars :"+vars.name+":"+vars.href+":"+vars.img);
        // };

        db.saveCategory(category.unit, website.address, website.name);
        for (var i = 0; i < latestVideo.length; i++) {
           var m = latestVideo.get(i);
           db.saveLatest(m.content, m.name, website.name);
        };
        for (var i = 0; i < latestVideo.length; i++) {
            var m = latestVideo.get(i);
            async.forEach(m.content, function(item, callback) {
//            console.log('1.1 enter: ' + item.name);
                videoDetailParser(item.href, item.img, website);
//            setTimeout(function(){
////                console.log('1.1 handle: ' + item.name);
//                callback(null, item.name);
//            }, 200);
            }, function(err) {
                console.log('err: ' + err);
            });
        }
    },null,'gbk').on('error', function(e) {
            console.log("Got error: " + e.message);
        });
}


var main = function(){
    for(var i = 0; i < settings.website.length; i++){
        var website = settings.website[i];
        console.log('start download website = '+website.address);

        everythingStart(website);
    }
}

//var url = 'http://www.tom51.com/play.htm?38288?5?6??DC6765F783BB3A909646DCEF6BD072A593F05225?%u6D3B%u7740%uFF0C%u6211%u4E0D%u60F3%u8FD9%u6837_BD.rmvb?1';
//
//nodegrass.get(url, function(data,status,headers){
//    console.log(data);
//},null,'gbk').on('error', function(e) {
//        console.log("Got error: " + e.message);
//    });


//start
main();


