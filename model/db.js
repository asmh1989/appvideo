var mongoose = require('mongoose');
var settings = require('../config/Settings.js');


mongoose.connect('mongodb://'+settings.db, function(err){
    if(err) throw err;
    console.log("connect ...."+settings.db);
});

var latest;
var videoDetailModel;
var DB = {

    /**
     * datas: 视频分类数据,放在每个网站中
     * http: 该网站的url
     * name: 该网站的简称
     */
    saveCategory:function(datas, http, name){
        require('./Website.js')();
        var website = mongoose.model('website');

        website.findOne({ address: http }, function (err, doc) {
            if (!doc) {
                console.log(name + "website will be added...");
                doc = new website;
                doc.name = name;
                doc.address = http;
                for (var i = 0; i < datas.length; i++) {
                    var data = datas[i];
                    doc.category.push({
                        name:data.name,
                        href:data.href
                    });
                };
                doc.save(function(err){
                    if(err){
                        console.log("save category err :"+err);
                    } else {
                        // console.log("save category successful..");
                    }
                });
            } else {
                console.log(name + "website already added...");
            }
        });
    },

    /**
     * 保存最近更新的视频到数据库
     * @param datas 视频数据
     * @param name  该视频所属分类
     * @param website 该适配所属网站
     */
    saveLatest:function(datas, name, website){
        if(!latest){
            require('./LatestSchema.js')(website);
            latest = mongoose.model(website+'latest');
        }

        latest.findOne({ name: name }, function (err, doc) {
            if (!doc) {
                console.log(website+"----"+name + " will be added...");
                var m = new latest;
                m.name = name;
                for (var i = 0; i < datas.length; i++) {
                    var data = datas[i];
                    m.content.push({
                        name:data.name,
                        img:data.img,
                        href:data.href
                    });
                }
                m.save(function(err){
                    if(err){
                        console.log("save "+name+" err :"+err);
                    } else {
                        // console.log("save "+name+" successful..");
                    }
                });
                return;
            }
            console.log(website+"----"+name + " already exist")
            for (var i = 0; i < datas.length; i++) {
                var data = datas[i];
                doc.content[i].name = data.name;
                doc.content[i].href = data.href;
            }
            doc.save(function(err){
                if(err){
                    console.log("save "+name+" err :"+err);
                } else {
                    // console.log("save "+name+" successful..");
                }
            });

        });
    },

    /**
     * 保存一个视频内容详情
     * @param datas 视频信息
     * @param website 所属网站
     */
    saveVideoDetail:function(datas, website){
        if(!videoDetailModel){
            require('./OneVideoSchema.js')(website);
            videoDetailModel = mongoose.model(website+'videoDetail');
        }

        var m = new videoDetailModel;
        m.name = datas.movieinfo[0];
        m.actor = datas.movieinfo[1];
        m.category = datas.movieinfo[2];
        m.language = datas.movieinfo[3];
        m.year = datas.movieinfo[4];
        m.origin = datas.movieinfo[5];
        m.uploadtime = datas.movieinfo[6];
        m.director = datas.movieinfo[7];
        m.about = datas.about;
        m.img = datas.img;
        m.href = datas.href;

        for(var i = 0; i < datas.qvod.length; i++){
            var n = datas.qvod[i];
            m.qvod.push({
                name: n.name,
                url: n.url
            });
        }

        m.save(function(err){
            if(err){
                console.log("save "+datas.movieinfo[0]+" err :"+err);
            } else {
                console.log("save "+datas.movieinfo[0]+" successful.."+err);
            }
        });
    },

    queryVideoDetail:function(website, href, callback){
        if(!videoDetailModel){
            require('./OneVideoSchema.js')(website);
            videoDetailModel = mongoose.model(website+'videoDetail');
        }

        videoDetailModel.findOne({ href: href }, function (err, doc) {
            if (!doc) {
                console.log(href+"  视频 还不存在, 马上添加");
                callback();
            }  else {
            console.log(href +"  这个已经存在, 不用添加");
            }
        })
    }
}

module.exports = DB;