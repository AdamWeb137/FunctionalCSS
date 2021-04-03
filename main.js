let classes_arr = {};
let css_variables = {};

class CSSArg {
    constructor(name){
        this.name = name;
    }
}

class CSSVariable {
    constructor(name){
        this.name = name;
    }
}

function SetCSSVariable(name, value){
    css_variables[name] = value;
}

function GetCSSVariable(name){
    return css_variables[name];
}

function isnotnull(v){
    return (v != null && v != undefined)
}

class CSSCLass {
    constructor(name, styles, args=null){
        if(name.indexOf("(") == -1 && name.indexOf(")") == -1){
            this.styles = styles;
            classes_arr[name] = this;
            this.args = args;
        }
    }

    apply_styles(element, params=null){
        if(isnotnull(element)){
            for(let style_name in this.styles){
                if(this.styles[style_name] instanceof CSSArg){
                    element.style[style_name] = params[this.styles[style_name].name];
                }else if(this.styles[style_name] instanceof CSSVariable){
                    element.style[style_name] = css_variables[this.styles[style_name].name];
                }else{
                    element.style[style_name] = this.styles[style_name];
                }
            }
        }
    }

}

Element.prototype.apply_class = function(name, params=null){
    let el = this;
    classes_arr[name].apply_styles(el, params);
}

function get_class_info(class_string){
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

        let arg_name = classes_arr[class_name].args[i];
        args_dict[arg_name] = value_list[i];
    }

    return {name:class_name, params:args_dict};

}

function get_classes(applied_string){
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

window.addEventListener("load", ()=>{
    let applied_els = document.querySelectorAll(".applied");
    for(let el of applied_els){
        let classes = get_classes(el.getAttribute("data-applied"));
        for(let fcssclass of classes){
            let info = get_class_info(fcssclass);
            console.log(info);
            el.apply_class(info.name, info.params);
        }
    }
});