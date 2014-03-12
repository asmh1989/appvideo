var nodegrass = require('nodegrass');
var db = require('./db.js');
var htmlparser = require("htmlparser2");
var mongoose = require('mongoose');
var async = require('async');


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
        var tmp = website.address+category.href;
        var location = tmp.lastIndexOf('.');
        tmp = tmp.substring(0, location)+'_'+page+tmp.substring(location);
//        console.log('startload page = '+tmp);

        nodegrass.get(tmp, function(data,status,headers){
            listVideos = new Array;
            video = _video();
            var parser = getNewParser();
            parser.parser.write(data);
            parser.parser.end();
            console.log('pages = '+tmp+' length= '+listVideos.length);

            db.saveVideos(listVideos, category, website.name, finalback);

        },null,'gbk').on('error', function(e) {
                console.log("Got error: " + e.message);
            }
        );
    }

    // 先解析首页
    nodegrass.get(website.address+category.href, function(data,status,headers){
        var parser = getNewParser();
        parser.parser.write(data);
        parser.parser.end();

        db.saveVideos(listVideos, category, website.name, function(result){
            console.log('result = '+result+' pages = '+pages+listVideos.length);
            if(!result){
            } else{
                var loadpages = new Array();
                for (var i = pages - 1; i > 1; i--){
                    loadpages.push(i);
                }

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
                });
            }
        });

    },null,'gbk').on('error', function(e) {
            console.log("Got error: " + e.message);
        }
    );
}