var model_data =function(){
	return {
		name: null,
		href: null
	}
};

var Category = {
	unit: [],
	datas: model_data(),
	add : function(){
		this.unit.push(this.datas);
		this.datas = model_data();
	}
}

module.exports = Category;