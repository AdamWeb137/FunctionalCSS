
class FCSSArg {
    constructor(name){
        this.name = name;
    }
}

class FCSSVariable {
    constructor(name){
        this.name = name;
    }
}

class FCSSClass {

    static fcss_variables = {};
    static fcss_classes = {};

    constructor(name, styles, args=null){
        if(name.indexOf("(") == -1 && name.indexOf(")") == -1){
            this.styles = styles;
            FCSSClass.fcss_classes[name] = this;
            this.args = args;
        }
    }

    apply_styles(element, params=null){
        if(FCSSClass.isnotnull(element)){
            for(let style_name in this.styles){
                if(this.styles[style_name] instanceof FCSSArg){
                    element.style[style_name] = params[this.styles[style_name].name];
                }else if(this.styles[style_name] instanceof FCSSVariable){
                    element.style[style_name] = FCSSClass.fcss_variables[this.styles[style_name].name];
                }else{
                    element.style[style_name] = this.styles[style_name];
                }
            }
        }
    }

    static isnotnull(v){
        return (v != null && v != undefined)
    }

    static GetFCSSVariable(name){
        return FCSSClass.fcss_variables[name];
    }

    static SetFCSSVariable(name, value){
        FCSSClass.fcss_variables[name] = value;
    }

    static get_class_info(class_string){
        let split = class_string.split("(");
        let class_name = split[0];
    
        if(class_string.indexOf("(") == -1){
            return {name:class_name, params:null};
        }
    
        let value_list = split[1].replace(")", "").split(",");
        let args_dict = {};
    
        /*remove whitespace at beggining and end and then add value of arg to arg dict*/
        for(let i = 0 ; i < value_list.length; i++){
            value_list[i] = value_list[i].replace(/^\s+|\s+$|\s+(?=\s)/g, "");
    
            let arg_name = FCSSClass.fcss_classes[class_name].args[i];
            args_dict[arg_name] = value_list[i];
        }
    
        return {name:class_name, params:args_dict};
    
    }

    static get_classes(applied_string){
        let depth = 0;
        let classes = [];
        let begin_index = 0;
        let on_class = false;
        for(var i = 0; i < applied_string.length; i++){
            if(applied_string[i] == " " && on_class && depth == 0){
                on_class = false;
                classes.push(applied_string.slice(begin_index,i));
                continue;
            }else if(applied_string[i] == "("){
                depth++;
            }else if(applied_string[i] == ")"){
                depth--;
            }else if(on_class == false){
                begin_index = i;
                on_class = true;
            }
        }
    
        if(on_class){
            classes.push(applied_string.slice(begin_index));
        }
    
        return classes;
    }

}

Element.prototype.apply_class = function(name, params=null){
    let el = this;
    FCSSClass.fcss_classes[name].apply_styles(el, params);
}

window.addEventListener("load", ()=>{
    let applied_els = document.querySelectorAll(".applied");
    for(let el of applied_els){
        let classes = FCSSClass.get_classes(el.getAttribute("data-applied"));
        for(let fcssclass of classes){
            let info = FCSSClass.get_class_info(fcssclass);
            el.apply_class(info.name, info.params);
        }
    }
});