FCSS.load(`
    &border-bottom(size, style, color){
        border-bottom-width:size;
        border-bottom-style:style;
        border-bottom-color:color;
    }

    &border-top(size, style, color){
        border-top-width:size;
        border-top-style:style;
        border-top-color:color;
    }

    &border-left(size, style, color){
        border-left-width:size;
        border-left-style:style;
        border-left-color:color;
    }

    &border-right(size, style, color){
        border-right-width:size;
        border-right-style:style;
        border-right-color:color;
    }

    &border(size, style, color){
        &border-left:size, style, color;
        &border-right:size, style, color;
        &border-top:size, style, color;
        &border-bottom:size, style, color;
    }

    &padding(t, r, b, l){
        padding-top:t;
        padding-right:r;
        padding-bottom:b;
        padding-left:l;
    }

    &padding_all(p){
        &padding:p,p,p,p;
    }

    &margin(t, r, b, l){
        margin-top:t;
        margin-right:r;
        margin-bottom:b;
        margin-left:l;
    }

    &margin_all(m){
        &margin:m,m,m,m;
    }

    &transition(name, duration, function){
        transition-property:name;
        transition-duration:duration;
        transition-timing-function:function;
    }

    &size(w,h){
        width:w;
        height:h;
    }

`, true);