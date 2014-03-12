var nodegrass = require('nodegrass');
var db = require('./db.js');
var htmlparser = require("htmlparser2");
var mongoose = require('mongoose');
var async = require('async');
var videoDetailParser = require('../model/VideoDetailParser.js');



module.exports = function (category, website){

    function _video() {
        return {
            href:null,
            name:null,
            img:null
        }
    };
    var is_start = false;
    var is_flist = false;
    var is_page = false;
    var video = _video();
    var listVideos = [];
    var is_firstPage = true;
    var pages = 0;
    var allvideos = [];

    function getNewParser(){
        return {
            parser: new htmlparser.Parser({
                onopentag: function(name, attribs){
                    if(name === 'div' && attribs.class === 'flist'){
                        is_flist = true;
                    } else if(is_firstPage && attribs.id === 'page'){
                        is_flist = false;
                        is_page = true;
                    }
                },

                onattribute: function(name, value){
                    if(is_flist){
                        if(name === 'href'){
                            video.href = value;
                        } else if(name === 'src'){
                            video.img = value;
                        } else if(name === 'alt'){
                            video.name = value;
                            is_start = true;
                        }
                    }
                },

                onopentagname: function(tagname){

                },

                ontext: function(text){
                    if(is_page && is_start){
                        pages = parseInt(text.substring(1));
                        console.log(category.name +" 共发现"+text+"页  pages ="+pages);
                        is_firstPage = false;
                        is_page = false;
                    }

                },

                onclosetag: function(tagname){
                    if(is_flist && is_start){
                        is_start = false;
                        if(video.name != null){
                            listVideos.push(video);
                        }
                        video = _video();
                    } else if(is_page && tagname === 'font'){
                        is_start = true;
                    }
                }
            })
        };
    }

    function startLoadPages(page, finalback){
        nodegrass.get(page, function(data,status,headers){
            listVideos = new Array;
            video = _video();
            var parser = getNewParser();
            parser.parser.write(data);
            parser.parser.end();
            allvideos.push(listVideos);

            console.log('pages = '+page+' length= '+listVideos.length);

            db.saveVideos(listVideos.reverse(), category, website.name, finalback);

        },null,'gbk').on('error', function(e) {
                console.log("Got error: " + e.message);
            }
        );
    }

    function parsePages(loadpages){

        async.mapSeries(loadpages, function(item, callback){
            startLoadPages(item, function(result){
                if(!result){
                    callback('already load');
                } else {
                    callback();
                }
            });

        }, function(err){
            console.log('loadpages done err = '+err);
            for(var i = 0; i < allvideos.length; i++){
                var datas = allvideos[i];
                async.forEach(datas, function(item, callback){
                    videoDetailParser(item.href, item.img,
                        website, function(notadd){
                            console.log('will delete ....'+notadd);
                            db.deleteVideo(website.name, notadd);
                        });
                }, function(err){
                    console.log('分类视频详细信息load完毕');
                });
            }
        });
    }

    // 先解析首页
    nodegrass.get(website.address+category.href, function(data,status,headers){
        var parser = getNewParser();
        parser.parser.write(data);
        parser.parser.end();
        allvideos.push(listVideos);

        db.queryVideos(website.name, category.href, function(result){
            if(!result){         //videos数据库中已存在数据
                console.log(category.name +' 已有数据')
                db.saveVideos(listVideos.reverse(), category, website.name, function(result){
                    console.log('result = '+result+' pages = '+pages+'....'+listVideos.length);
                    if(!result){
                    } else{
                        var loadpages = new Array();
                        for (var i = 1; i < pages; i++){
                            var tmp = website.address+category.href;
                            var location = tmp.lastIndexOf('.');
                            tmp = tmp.substring(0, location)+'_'+i+tmp.substring(location);
                            loadpages.push(tmp);
                        }
                        parsePages(loadpages);
                    }
                });
            } else {
                console.log(category.name+' 中还未有数据,需重新下载');
                var loadpages = new Array();
                for (var i = 1; i < pages; i++){
                    var tmp = website.address+category.href;
                    var location = tmp.lastIndexOf('.');
                    tmp = tmp.substring(0, location)+'_'+i+tmp.substring(location);
                    loadpages.push(tmp);
                }
                loadpages.push(website.address+category.href);
                parsePages(loadpages);
            }
        });



    },null,'gbk').on('error', function(e) {
            console.log("Got error: " + e.message);
        }
    );
}