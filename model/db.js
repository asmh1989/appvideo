var mongoose = require('mongoose');
var settings = require('../config/Settings.js');
var async = require('async');


mongoose.connect('mongodb://'+settings.db, function(err){
    if(err) throw err;
    console.log("connect ...."+settings.db);
});

var latestModels = [];
var videoModels = [];
var videoDetailModels = [];
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
        var latestModel;
        if(latestModels.length > 0){
            for(var i = 0; i < latestModels.length; i++){
                if(latestModels[i].name === website){
                    latestModel = latestModels[i].schema;
                }
            }
        }

        if(!latestModel){
            require('./LatestSchema.js')(website);
            latestModel  = mongoose.model(website+'latest');
            latestModels.push({
                name:website,
                schema:latestModel
            });
        }

        latestModel.findOne({ name: name }, function (err, doc) {
            if (!doc) {
//                console.log(website+"----"+name + " will be added...");
                var m = new latestModel;
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
//            console.log(website+"----"+name + " already exist")
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
     * 保存分类的视频信息
     * @param listVideos 视频数据
     * @param category  分类
     * @param website   所属网站
     * @param finalCall  结果回调
     */
    saveVideos:function(listVideos, category, website, finalCall){
        var videoModel;
        if(videoModels.length > 0){
            for(var i = 0; i < videoModels.length; i++){
                if(videoModels[i].name === website){
                    videoModel = videoModels[i].schema;
                }
            }
        }

        if(!videoModel){
            require('./VideosSchema.js')(website);
            videoModel  = mongoose.model(website+'videos');
            videoModels.push({
                name:website,
                schema:videoModel
            });
        }

        var count = 0;

        async.mapSeries(listVideos, function(item, callback){
            videoModel.findOne({href: item.href}, function(err, doc){
                if (!doc) {
//                    console.log(website+"----"+item.href + " will be added...");
                    var m = new videoModel;
                    m.href = item.href;
                    m.name = item.name;
                    m.img = item.img;
                    m.cat_name = category.name;
                    m.cat_href = category.href;
                    m.save(function(err){
                        if(err){
                            console.log("save "+item.name+" err :"+err);

                        } else {
//                            console.log("save "+item.name+' successful.');
                        }
                        callback();
                    });
                } else {
                    console.log(website+"----"+item.name + " already exist")
                    callback('已经load,不用在执行后面的了');
                    finalCall(false);
                }
            })
        }, function(err){
//            console.log("all done  err = "+err);
            if(err == null){
                finalCall(true);
            }
        });
    },

    /**
     * 保存一个视频内容详情
     * @param datas 视频信息
     * @param website 所属网站
     */
    saveVideoDetail:function(datas, website){
        var videoDetailModel;
        if(videoDetailModels.length > 0){
            for(var i = 0; i < videoDetailModels.length; i++){
                if(videoDetailModels[i].name === website){
                    videoDetailModel = videoDetailModels[i].schema;
                }
            }
        }

        if(!videoDetailModel){
            require('./OneVideoSchema.js')(website);
            videoDetailModel  = mongoose.model(website+'videoDetail');
            videoDetailModels.push({
                name:website,
                schema:videoDetailModel
            });
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
//                console.log("save "+datas.movieinfo[0]+" successful.."+err);
            }
        });
    },

    /**
     *  查询视频的详细信息是否存在于数据库中
     * @param website
     * @param href
     * @param callback
     */
    queryVideoDetail:function(website, href, callback){
        var videoDetailModel;
        if(videoDetailModels.length > 0){
            for(var i = 0; i < videoDetailModels.length; i++){
                if(videoDetailModels[i].name === website){
                    videoDetailModel = videoDetailModels[i].schema;
                }
            }
        }

        if(!videoDetailModel){
            require('./OneVideoSchema.js')(website);
            videoDetailModel  = mongoose.model(website+'videoDetail');
            videoDetailModels.push({
                name:website,
                schema:videoDetailModel
            });
        }

        videoDetailModel.findOne({ href: href }, function (err, doc) {
            if (!doc) {
                console.log(href+"  视频 还不存在, 马上添加");
                callback();
            }  else {
                console.log(href +"  这个已经存在, 不用添加");
            }
        })
    },

    /**
     * 查询视频的分类信息是否存在
     * @param website
     * @param href
     * @param callback
     */
    queryVideos:function(website, href, callback){
        var videoModel;
        if(videoModels.length > 0){
            for(var i = 0; i < videoModels.length; i++){
                if(videoModels[i].name === website){
                    videoModel = videoModels[i].schema;
                }
            }
        }

        if(!videoModel){
            require('./VideosSchema.js')(website);
            videoModel  = mongoose.model(website+'videos');
            videoModels.push({
                name:website,
                schema:videoModel
            });
        }

        videoModel.findOne({cat_href:href}, 'href','', function (err, doc) {
            console.log('queryVideos:cat_href='+href +' doc ='+doc+' err='+err);
            if (!doc || doc.length == 0) {
                callback(true);
            }  else {
                callback(false);
            }
        })
    },

    /**
     * 删除不包含qvod链接的视频信息,在XXXvideos数据表中
     * @param website 该视频信息所属网站
     * @param href    链接,作为唯一id
     */
    deleteVideo:function(website, href){
        var videoModel;
        if(videoModels.length > 0){
            for(var i = 0; i < videoModels.length; i++){
                if(videoModels[i].name === website){
                    videoModel = videoModels[i].schema;
                }
            }
        }

        if(!videoModel){
            require('./VideosSchema.js')(website);
            videoModel  = mongoose.model(website+'videos');
            videoModels.push({
                name:website,
                schema:videoModel
            });
        }

        videoModel.remove({href: href}, function(err){
            if(err){
                console.log(deleteVideo+' err = '+err);
            }
        })
    }



}

module.exports = DB;