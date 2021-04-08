
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

class FCSSElement {
    constructor(selector){
        this.selector = selector;
    }
}

class FCSSShorthand {
    constructor (name, args, styles){
        this.name = name;
        this.arg_names = args;
        this.styles = styles;

        FCSS.shorthands[name] = this;

    }

    get_styles_dict(args){
        let dict = {};
        for(let i = 0; i < args.length; i++){
            dict[this.arg_names[i]] = args[i];
        }
        return dict;
    }

    render_js(args){
        let write_text = "";
        let styles_dict = this.get_styles_dict(args);
        for(let i = 0; i < this.styles.length; i++){
            let key = this.styles[i][0];
            let value_name = this.styles[i][1];
            write_text += `${FCSS.to_camel_case(key)}:${FCSS.type_to_value_string(styles_dict[value_name].trim())},`;
        }
        return write_text;
    }

    get_style_value_pairs(args){
        let pairs = [];
        let styles_dict = this.get_styles_dict(args);
        for(let i = 0; i < this.styles.length; i++){
            let key = this.styles[i][0];
            let value_name = this.styles[i][1];
            pairs.push([key, styles_dict[value_name].trim()]);
        }
        return pairs;
    }

}

class FCSS {

    static global_variables = {};
    static classes = {};
    static shorthands = {};

    static elements_by_class = {};

    static GetFirstElement(class_name){
        return FCSS.elements_by_class[class_name][0];
    }

    static GetAllElements(class_name){
        return FCSS.elements_by_class[class_name];
    }

    constructor(name, styles, args=null){
        if(name.indexOf("(") == -1 && name.indexOf(")") == -1 && name.length > 0){
            this.styles = styles;
            FCSS.classes[name] = this;
            FCSS.elements_by_class[name] = [];
            this.args = args;
            this.name = name;
        }
    }

    apply_styles(element, params=null){
        if(FCSS.isnotnull(element)){
            for(let style_name in this.styles){

                if(!(style_name in element.fstyles_affected)){
                    element.fstyles_affected[style_name] = {
                        classes:[""],
                        values:[element.style[style_name]]
                    };
                }

                if(this.styles[style_name] instanceof FCSSArg){
                    element.style[style_name] = params[this.styles[style_name].name];
                }else if(this.styles[style_name] instanceof FCSSVariable){
                    element.style[style_name] = FCSS.global_variables[this.styles[style_name].name];
                }else if(this.styles[style_name] instanceof FCSSElement){
                    let selected_el = FCSS.GetSelected(element, this.styles[style_name].selector);
                    let selector_style_name = FCSS.GetStyleNameFromSelector(style_name, this.styles[style_name].selector);
                    element.style[style_name] = selected_el.style[selector_style_name];
                }else{
                    element.style[style_name] = this.styles[style_name];
                }

                element.fstyles_affected[style_name].classes.push(this.name);
                element.fstyles_affected[style_name].values.push(element.style[style_name]);

            }
        }
    }

    static GetSelected(element, selector){
        selector = (selector[0] == "@") ? selector.slice(1) : selector;
        selector = (selector.indexOf("[") > -1) ? selector.slice(0,selector.indexOf("[")) : selector;
        if(selector == "parent"){
            return element.parentElement;
        }else if(selector == "child"){
            return element.children[0];
        }else if(selector == "self"){
            return element;   
        }else{
            return document.querySelector(selector);
        }
    }

    static GetStyleNameFromSelector(style_name,selector){
        let split = selector.split("[");
        if(split.length > 1){
            let name = FCSS.to_camel_case(split[1].replace("]",""));
            return name;
        }else{
            return style_name;
        }
    }

    static isnotnull(v){
        return (v != null && v != undefined)
    }

    static GetGlobal(name){
        return FCSS.global_variables[name];
    }

    static SetGlobal(name, value){
        FCSS.global_variables[name] = value;
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
    
            let arg_name = FCSS.classes[class_name].args[i];
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

    static to_camel_case(hyphenated){
        while(hyphenated.indexOf("-") != -1){
            let i = hyphenated.indexOf("-");
            hyphenated = hyphenated.slice(0,i) + hyphenated[i+1].toUpperCase() + hyphenated.slice(i+2);
        }
        return hyphenated;
    }

    static type_to_value_string(value){

        if(value.length > 0){

            if(value[0] == "@"){
                return `new FCSSElement('${value}')`;
            }


            let var_type = 0;
            while(value[0] == "$"){
                var_type++;
                value = value.slice(1);
            }


            if (var_type == 0){
                return `'${value}'`;
            }
            else if(var_type == 1){
                return `new FCSSArg('${value}')`;
            }
            else if(var_type == 2){
                return `new FCSSVariable('${value}')`;
            }

        }

    }

    static load(text){
        let script = document.createElement("script");
        let write_text = "";

        let depth = 0;
        let state = "none";

        let vars_by_state = {
            "at_global":"",
            "at_class":"",
            "in_class":"",
            "at_params":"",
            "at_style_value":"",
            "at_var_value":"",
            "at_short":"",
            "at_short_params":"",
            "in_short":"",
            "at_short_style":"",
            "class_short":"",
            "class_short_params":"",
            "meta_short":"",
            "meta_short_params":""
        };

        let depth_dict = {
            "(":0,
            "{":0,
            "[":0
        };

        let add_c = function(c){
            vars_by_state[state] += c;
        }

        let clear_any_state = function(){
            for(let arg of arguments){
                vars_by_state[arg] = "";
            }
        }

        let clear_state = function(){
            clear_any_state(state);
        }

        let alpha_numer_str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-";
        let alpha_plus = alpha_numer_str+"',.()@[]%*+-/#^!& ";

        let class_params = [];
        let style_type = 0;

        let short_params = [];
        let short_styles_values = [];

        let class_short_params = [];
        let meta_short_params = [];

        let comment_slashes = 0;
        let can_run = true;

        let action_by_state = {
            "*":{
                "/":function(c){
                    comment_slashes++;
                },
                "\n":function(c){
                    comment_slashes=0;
                }
            },
            "none":{
                ".":(c)=>{state = "at_class";},
                "{":function(c){
                    if(vars_by_state["at_class"] != ""){
                        write_text += `new FCSS('${vars_by_state["at_class"]}', {`;
                        state = "in_class";
                    }else if(vars_by_state["at_short"] != ""){
                        state = "in_short";
                    }
                },
                "&":(c)=>{state = "at_short";},
                [alpha_numer_str]:function(c){
                    state = "at_global";
                    add_c(c);
                },
            },
            "at_short":{
                "(":(c)=>{state = "at_short_params";},
                [alpha_numer_str]:add_c,
            },
            "at_short_params":{
                ",":function(c){
                    short_params.push(vars_by_state[state]);
                    clear_state();
                },
                ")":function(c){
                    short_params.push(vars_by_state[state]);
                    clear_state();
                    state = "none";
                },
                [alpha_numer_str]:add_c,
            },
            "in_short":{
                ":":(c)=>{state = "at_short_style";},
                "}":function(c){
                    new FCSSShorthand(vars_by_state["at_short"], short_params, short_styles_values);
                    clear_any_state("at_short","at_short_params");

                    short_params = [];
                    short_styles_values = [];

                    state = "none";
                },
                "&":(c)=>{state = "meta_short";},
                [alpha_numer_str]:add_c,
            },
            "meta_short":{
                [alpha_numer_str]:add_c,
                ":":(c)=>{state = "meta_short_params";}
            },
            "meta_short_params":{
                [alpha_numer_str]:add_c,
                ",":function(c){
                    meta_short_params.push(vars_by_state[state]);
                    clear_state();
                },
                ";":function(c){
                    meta_short_params.push(vars_by_state[state]);
                    clear_state();
                    short_styles_values = short_styles_values.concat(FCSS.shorthands[vars_by_state["meta_short"]].get_style_value_pairs(meta_short_params));
                    state = "in_short";

                    clear_any_state("meta_short","meta_short_params");
                    meta_short_params = [];

                }
            },
            "at_short_style":{
                [alpha_numer_str]:add_c,
                ";":function(c){
                    short_styles_values.push([vars_by_state["in_short"],vars_by_state["at_short_style"]]);
                    clear_any_state("in_short","at_short_style");
                    state = "in_short";
                }
            },
            "at_global":{
                [alpha_numer_str]:add_c,
                "=":(c)=>{state = "at_var_value";},
            },
            "at_var_value":{
                [alpha_plus]:add_c,
                ";":function(c){
                    write_text += `FCSS.SetGlobal('${vars_by_state["at_global"]}','${vars_by_state["at_var_value"].trim()}');`;
                    clear_any_state("at_global","at_var_value");
                    state = "none";
                }
            },
            "at_class":{
                [alpha_numer_str]:add_c,
                "(":(c)=>{state = "at_params";},
                "{":function(c){
                    if(vars_by_state["at_class"] != ""){
                        write_text += `new FCSS('${vars_by_state["at_class"]}', {`;
                        state = "in_class";
                    }
                }
            },
            "at_params":{
                [alpha_numer_str]:add_c,
                ",":function(c){
                    class_params.push(vars_by_state[state]);
                    clear_state();
                },
                ")":function(c){
                    class_params.push(vars_by_state[state]);
                    clear_state();
                    state = "none";
                },
            },
            "in_class":{
                [alpha_numer_str]:add_c,
                ":":(c)=>{state = "at_style_value";},
                "}":function(c){
                    write_text += `}${(class_params.length > 0) ? ", " + JSON.stringify(class_params) : ""});`;
                    clear_any_state("at_class","at_params");
                    class_params = [];
                    state = "none";
                },
                "&":(c)=>{state = "class_short";}
            },
            "class_short":{
                [alpha_numer_str]:add_c,
                ":":(c)=>{state = "class_short_params";}
            },
            "class_short_params":{
                ",":function(c){
                    class_short_params.push(vars_by_state[state]);
                    clear_state();
                    can_run = false;
                },
                ";":function(c){
                    class_short_params.push(vars_by_state[state]);
                    clear_state();
                    console.log(vars_by_state["class_short"]);
                    write_text += FCSS.shorthands[vars_by_state["class_short"]].render_js(class_short_params);
                    class_short_params = [];
                    clear_any_state("class_short","class_short_params");
                    state = "in_class";
                },
                [alpha_plus]:add_c,
                "$":add_c,
            },
            "at_style_value":{
                ";":function(c){ 
                    write_text += ` ${FCSS.to_camel_case(vars_by_state["in_class"])}:${FCSS.type_to_value_string(vars_by_state["at_style_value"].trim())},`;
                    clear_any_state("in_class","at_style_value");
                    style_type = 0;
                    state = "in_class";
                },
                "$":add_c,
                [alpha_plus]:add_c,
            }
        };
        

        for(let i = 0; i < text.length; i++){
            let c = text[i];
            let keys = Object.keys(action_by_state[state]);

            can_run = true;

            for(let k of Object.keys(action_by_state["*"])){
                if(k == c){
                    action_by_state["*"][k](c);
                }
            }

            for(let key of keys){
                if((key == c || key.indexOf(c) > -1) && comment_slashes < 2 && can_run){
                    action_by_state[state][key](c);
                }
            }
        }

        document.querySelector("head").appendChild(script);
        script.innerHTML = write_text;

    }

    static load_from_url(url){

        /*not tested*/

        let request = new XMLHttpRequest();

        let url_split = window.location.href.split('/');
        let new_url = url_split.slice(0,url_split.length-1).join('/')+url;

        request.open('GET', new_url, true);
        request.send(null);
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                var type = request.getResponseHeader('Content-Type');
                if (type.indexOf("text") !== 1) {
                    FCSS.load(request.responseText);
                }
            }
        }
    }

}

Element.prototype.apply_fclass = function(name, params=null){

    let el = this;

    if(!el.hasOwnProperty("fclass_list")){
        el.fclass_list = new Set();
    }

    if(!el.hasOwnProperty("fstyles_affected")){
        el.fstyles_affected = {};
    }

    if(name in FCSS.classes){
        FCSS.classes[name].apply_styles(el, params);
        FCSS.elements_by_class[name].push(el);
    }else{
        FCSS.elements_by_class[name] = [el];
    }

    el.fclass_list.add(name);
    el.classList.add(name);
}

Element.prototype.remove_fclass = function(name){
    let el = this;

    if(!el.hasOwnProperty("fclass_list")){
        el.fclass_list = new Set();
    }

    if(!el.hasOwnProperty("fstyles_affected")){
        el.fstyles_affected = {};
    }

    el.fclass_list.delete(name);
    el.classList.remove(name);

    if(name in FCSS.classes){    

        let i = FCSS.elements_by_class[name].indexOf(el);
        if(i > -1){
            FCSS.elements_by_class[name].splice(i, 1);
        }

        for(let style in el.fstyles_affected){
            let class_list = el.fstyles_affected[style].classes;
            let value_list = el.fstyles_affected[style].values;


            let class_index = class_list.indexOf(name);
            if(class_index != -1){
                class_list.splice(class_index,1);
                value_list.splice(class_index,1);

                el.style[style] = value_list[value_list.length-1];
            }

        }

    }
}


window.addEventListener("load", ()=>{
    let applied_els = document.querySelectorAll("[fclass]");
    for(let el of applied_els){
        let classes = FCSS.get_classes(el.getAttribute("fclass"));
        for(let fcss_class of classes){
            let info = FCSS.get_class_info(fcss_class);
            el.apply_fclass(info.name, info.params);
        }
    }
});