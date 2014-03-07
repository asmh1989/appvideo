var nodegrass = require('nodegrass');
var db = require('./db.js');
var htmlparser = require("htmlparser2");
var mongoose = require('mongoose');

module.exports = function (href, img, website){
    var ismoveinfo = false;
    var isabout = false;
    var txt = '';
    var isPart = false;
    var is_start = false;
    var is_userlist = false;
    var content2 = {
        movieinfo:[],
        qvod:[],
        about:null,
        href:null,
        img:null
    };
    var isSave = true;
    var isQvodAddress = false;

    var startParse = function(p, data){
        p.write(data);
        p.end();
    }

    var httptoqvod = function(url){
        var AdnUrl=url ;
        AdnUrl=AdnUrl.split("?") ;
        if(AdnUrl[3]==6){
            if(AdnUrl[4]==""){
                if (parseInt(AdnUrl[5].indexOf("://"))<1){
                    AdnUrl[5]="qvod://118953614|"+AdnUrl[5]+"|[tom51.com]"+unescape(AdnUrl[6])+"|";
                }
            }
            else{
                AdnUrl[5]=AdnUrl[4]+"?"+AdnUrl[5]
            }
        }else if(AdnUrl[3]==21){
            AdnUrl[5]="bdhd://118953614|"+AdnUrl[5]+"|[tom51.com]"+unescape(AdnUrl[6])+"";
        }

        return AdnUrl[5];
    }
    var parser =new htmlparser.Parser({
        onopentag: function(name, attribs){
            if(name === "div" && attribs.class === "movie_info"){
                ismoveinfo = true;
//            console.log("hello row1");
            } else if(attribs.class === 'urllist'){
                ismoveinfo = false;
                is_userlist = true;
                is_start = false;
            } else if(attribs.class === 'udall ud5'){
                isQvodAddress = true;
            } else if(isQvodAddress && attribs.class === 'about'){
                isQvodAddress = false;
                isabout = true;
                is_start = false;
            }
        },
        onattribute: function(name, value){
            if(ismoveinfo){
//            console.log('onattribute: name = '+name+" value = "+value);
                if(value === 'left'){
                    is_start = true;
                    isPart = false;
                } else if(value.indexOf('row_righ') != -1){
                    is_start = true;
                    isPart = true;
                }
            } else if(isQvodAddress && name === 'href'){
//            console.log("found qvod url = "+value);
                content2.qvod.push({
                    url:httptoqvod(value),
                    name:''
                });
            }
        },
        onopentagname: function(tagname){
            if(isabout && !is_start && tagname === 'img'){
                is_start = true;
            } else if(is_userlist && !is_start && tagname === 'h1'){
                is_start = true;
            }
        },

        ontext: function(text){
            if(ismoveinfo && is_start){
//            console.log('ontext: text = '+text);
                if(isPart){
                    txt +=text
                    content2.movieinfo.push(txt);
                } else {
                    txt = text;
                }
            } else if(isQvodAddress){
                var len = content2.qvod.length - 1;
                if(content2.qvod[len].name === ''){
                    content2.qvod[len].name = text;
                console.log("finish qvod url = "+content2.qvod[len]);
                }
            } else if(isabout && is_start){
                content2.about = text;
//            console.log("add about = "+text);
                isabout = false;
            } else if(is_start && is_userlist){

                is_userlist = false;
                if(text.indexOf('QVOD') == -1){
//                    console.log("found 视频源 === "+text+" 不符合, 不用保存");
                    isSave = false;
                    is_userlist = true;
                    is_start = false;
                }
            }
        },
        onclosetag: function(tagname){
            if(ismoveinfo && tagname === 'div'){
                is_start = false;
            }
        }
    });


    db.queryVideoDetail(website.name, href, function(){
        console.log("now to into callback");
        nodegrass.get(website.address+href, function(data,status,headers){

            startParse(parser, data);
            if(!isSave){
                return;
            }
//        console.log(content2);
            content2.img = img;
            content2.href = href;
            console.log("finish =="+website.address+href+"  .... "+content2.movieinfo);
            db.saveVideoDetail(content2, website.name);
        },null,'gbk').on('error', function(e) {
                console.log("Got error: " + e.message);
            }
        );
    });

}
