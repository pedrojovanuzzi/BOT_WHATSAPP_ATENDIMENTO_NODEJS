
class MenuController{
    async index(req,res){
        return res.render('menu');
    }

    async lastPix(req,res){
        return res.render('pixLast');
    }
    
    async allPix(req,res){
        return res.render('allPix');
    }

    async LastPixOpen(req,res){
        return res.render('pixLastAberto');
    }

}
export default new MenuController();