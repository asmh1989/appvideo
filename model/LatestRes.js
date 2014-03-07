var model_data =function(){
	return {
		img: null,
		name: null,
		href: null
	}
};
var LatestVideo = {
	movies: {content:[], name:'电影'},						//电影
	tvs: {content:[], name:'电视剧'},							//电视剧
	cartoon: {content:[], name:'动漫'},						//动漫
	variety: {content:[], name:'综艺'},						//综艺
	datas: model_data(),
	add : function(i){
		switch(i){
			case 0: this.movies.content.push(this.datas);break;
			case 1: this.tvs.content.push(this.datas);break;
			case 2: this.cartoon.content.push(this.datas);break;
			case 3: this.variety.content.push(this.datas);break;
		}
		this.datas = model_data();
	},

	length: 4,

	get:function(i){
		switch(i){
			case 0: return this.movies;
			case 1: return this.tvs;
			case 2: return this.cartoon;
			case 3: return this.variety;
		}

		throw "error no latest type";
	}
}

module.exports = LatestVideo;