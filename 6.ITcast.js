/**
 * Created by pingbaobei on 2016/8/19.
 */
(function(window,undefined){
    //1.构造函数
    function Itcast(selector){
        return new Itcast.fn.init(selector);
    };


    //2.原型
    Itcast.fn = Itcast.prototype = {
        constructor:Itcast,
        length:0,
        type:'Itcast',//在原型中的属性，创建出来的实例对象都具有该属性，用来判断itcast对象
        init:function(selector){
            if(!selector){
                return this;
            }

            //字符串
            if(typeof selector == 'string'){
                if(selector.charAt(0)==='<'){
                    //将字符串转换为DOM对象，然后添加到this中
                    [].push.apply(this,Itcast.parseHTML(selector));
                }else {
                    //选择器
                    [].push.apply(this,Itcast.Select(selector));
                }
                return this;
            }

            if(typeof selector == 'function'){
                //对于页面下载的onload方法必须重新加载
                //如果传入的是函数，不需要进行处理
                //window.onload = selector;
                //如果需要进行处理的话，我们先将旧的函数取出来，然后和新的传入的函数合并，只要保证能够被加载到页面，并且旧的函数先执行，新的函数后执行就可以
                var oldFunc = window.onload;
                if(typeof oldFunc == "function"){
                    window.onload = function(){
                        oldFunc();
                        selector();
                    }
                }else{
                    window.onload = selector;
                }

            }

            //三 - 一：DOM对象
            //dom，itcast调用返回的是ITcast对象，
            if(selector.nodeType){
                //this[this.length++]=selector;
                this[0]=selector;
                this.length = 1;
                //伪数组是刚刚创建出来的，里面什么都没有，就存储了一个DOM对象，所以直接使用上面的方法
                return this;
            }

            //六、Itcast对象
            if(selector.type=='Itcast'){
                //理论上说如果传入的是itcast对象，我们直接返回接返回ITcast对象，但是会将刚刚创建的this丢弃
                //或者将selector的所有项加到this中，返回this，itcast对象之间的区别，实际上就是伪数组。
                //return selector;直接返回selector，将之前的 丢弃
                [].push.apply(this,selector);
                return this;//所有的加到当前的对象，然后将当前对象返回
            }

            //七，数组
            //如果传入的参数都不属于上面的范围，直接当做数组处理，默认是伪数组，如果不是伪数组，就放到伪数组的第0项,想办法变成数组
            if(selector.length>=0){
                [].push.apply(this,selector);
            }else{
                this[0] = selector;
                this.length = 1;
            }

            return this;
            //返回一个空的伪数组，但是具有原型中的方法，在为数组中存储DOM对象
        },

        //一、数组方法,将itcast对象转换成数组返回
        toArray:function(){
            return [].slice.call(this,0);
        },

        //二、get方法,根据参数返回DOM对象或者DOM数组
        get:function(index){
            if(index === undefined){
                return this.toArray();
            }else{
                if(index>=0){
                    return this[index];
                }else{
                    return this[index+this.length];
                }
            }
        },

        //toArray和get是操作的DOM对象

        //三、eq/first/last的使用测试,操作的是Itcast对象
        // 使用get来获得对应的DOM元素或者是空，在构造函数内部调用构造函数不用构造函数的名字，而是用this.constructor，然后使用构造函数将他包装成itcast对象(无论是DOM还是空都是返回ITcast对象)
        eq:function(index){
            var newObj=constructor(this.get(index));//调用一下构造方法
            newObj.prev = this;//恢复链使用
            return newObj;
        },

        first:function(){
            return this.eq(0);
        },

        last:function(){
            return this.eq(-1);
        },

        //五、each和map是用于遍历
        each:function(callback){
            return Itcast.each(this,callback);//each遍历this

        },

        map:function(callback){
            return Itcast.map(this,callback);

        },



    };
    //让init的原型与Itcast的原型一致，这样子实例就可以有原型中的方法
    Itcast.fn.init.prototype = Itcast.fn;


    //3.添加extend方法
    Itcast.extend = Itcast.fn.extend = function (obj){
        for(var k in obj){
            this[k] = obj[k];
        }
    };


    //四.添加核心模块的工具方法
    Itcast.extend({
        each:function (arr,callback){
            //数组或者伪数组
            if(arr.length>=0){
                for(var i=0;i<arr.length;i++){
                    var res =  callback.call(arr[i],i,arr[i])
                    if(res == false){
                        break;
                    };
                }
            }else {
                //对象
                for(var k in arr){
                    var res = callback.call(arr[k],k,arr[k]);
                    if(res == false){
                        break;
                    };
                }
            }
            return arr;
        },
        map:function (arr,callback){
            var res= [];
            if(arr.length>=0){
                for(var i=0;i<arr.length;i++){
                    var v= callback(arr[i],i);
                    if(v !== undefined){
                       res.push(v);
                    };
                }
            }else {
                for(var k in arr){
                    var v = callback(arr[k],k);
                    if(v !== undefined){
                        res.push(v);
                    }
                }
            }
            return res;
        }
    });

    //6.选择器模块
    var Select =
        (function(){
            /*
             * 1.创建一个support对象，将需要的方法进行检测，得到方法的能力
             * 2.需要使用的有兼容性的办法，定义一个可以完成该方法的函数来替代，在函数内部进行处理
             * 3.定义一个select函数，看他是否支持qsa,如果支持的话直接使用，不能支持的话就是自己实现
             * */

            //1，定义变量
            var support = {},
                rnative = /\[native code\]/,
                push = [].push;//避免每次都要新建数组，提高性能

            //处理push的兼容性问题
            try {
                //模拟处理伪数组
                push.apply([],document.getElementsByTagName('*'));
            }catch(e){
                //自己实现push.apply方法
                push = {
                    apply:function (a,b){
                        //将b中的元素加给a
                        for(var i=0;i< b.length;i++){
                            a[a.length++]=b[i];
                        }
                        return a.length;
                    },//我们用call方法在实现一次
                    call:function(a){
                        var ars = [].slice.call(arguments,1);
                        this.apply(a,ars);//直接使用我们上面的方法
                    }
                }
            }

            //1.处理document兼容问题
            support.qsa = rnative.test(document.querySelectorAll+"");
            support.getElementsByClassName = rnative.test(document.getElementsByClassName);

            //2.处理element的兼容问题
            var div = document.createElement("div");
            support.getElementsByClassName2 = rnative.test(div.getElementsByClassName);
            support.indexOf = rnative.test(Array.prototype.indexOf+"");
            support.trim = rnative.test(String.prototype.trim+'');

            //4.indexOf方法
            function indexOf(arr,search,startIndex){
                startIndex = startIndex || 0;
                if(support.indexOf){
                    return arr.indexOf(search,startIndex);
                }
                //自己实现
                for(var i=startIndex;i<arr.length;i++){
                    if(arr[i]===search){
                        return i;
                    }
                }
                return -1;
            }


            //7.去掉数组中的重复元素(1准备一个新数组，遍历旧数组，将元素一次加入到新数组中，如果存在就不加),写好之后对相应的元素进行过滤
            function unique(arr){
                var newArr = [];
                for(var i=0;i<arr.length;i++){
                    //直接调用indexOf方法
                    if(indexOf(newArr,arr[i]) == -1){
                        newArr.push(arr[i]);
                    }
                }
                return newArr;
            }



            //3.实现getByClassName
            function getByClass(className,node){
                //判断我们的元素在哪里,如果系统有的话我们就直接使用
                if(node == document && support.getElementsByClassName  ||
                    node.nodeType == 1 && support.getElementsByClassName2){

                    return node.getElementsByClassName(className);
                } else{
                    //自己实现
                    var arr = [],
                        list = node.getElementsByTagName("*"),
                        tempClassName;
                    //循环遍历
                    for(var i=0;i<list.length;i++){
                        //3.2 indexOf()有兼容性问题，我们要进行自己封装
                        tempClassName = list[i].getAttribute("class");
                        if(!tempClassName) continue;
                        if(indexOf(tempClassName.split(' '),
                                className) != -1){
                            arr.push(list[i]);
                        }
                    }
                    return arr;
                }
            }


            //8.trim()方法在IE8中不支持，我们需要自己实现
            function trim(str){
                if (support.trim){
                    return str.trim();
                }
                return str.replace(/^\s+|\s+$/g,'');
            }

            //实现select
            var Select=function(selector,results){
                results = results || [];
                if(support.qsa){
                    push.apply(results,document.querySelectorAll(selector));
                    return unique(results);
                }
                return select2(selector,results);
            };

            //获取元素
            function t(tagName,results){
                results = results || [];
                push.apply(results,document.getElementsByTagName(tagName));
                return results;
            };
            function c(className,results){
                results = results || [];
                push.apply(results,getByClass(className,document));
                return results;
            };
            function id(idName,results){
                results = results || [];
                var dom = document.getElementById(idName);
                if(dom){
                    push.call(results,dom);
                }
                //[].push.call(results,document.getElementById(idName));返回的是[null],我们让他在没有元素的时候返回[]
                return results;
            };

            //5.组合选择器（将字符串split成数组，然后去除两端的空格trim()，进行遍历）
            function select2(selector,results){
                results = results || [];
                var list = selector.split(',');
                for(var i=0;i<list.length;i++){
                    select3(trim(list[i]),results);
                }
                return unique(results);
            }

            //实现select
            function select3(selector,results){
                //6.基本选择器中部出现空格split('').lenght==1，就用基本选择器
                if(selector.split(' ').length === 1){
                    var first = selector.charAt(0);
                    if(selector==="*"){
                        //return document.getElementsByTagName(selector);//直接使用我们自己实现的获取元素方法
                        return t(selector,results);
                    }else if(first === "#"){
                        return id(selector.slice(1),results);
                    }else if(first ==="."){
                        return c(selector.slice(1),results);
                    }else{
                        return t(selector,results);
                    }
                }else{
                    throw new Error("你输入的选择器本方法目前不支持，请于蒋坤联系.......")
                }

            }
            return Select;
        })();
    Itcast.Select = Select;

    //5.DOM操作模块
    // 工具方法(静态方法)
    //5.1将字符串转为DOM对象
    Itcast.parseHTML = (function(){
        var node = document.createElement('div');
        function parseHTML(str){
            node.innerHTML = str;
            var arr =[];
            arr.push.apply(arr,node.childNodes);
            return arr;
        }
        return parseHTML;
    })();


    //4.给实例添加append方法，实例方法
    /*Itcast.fn.extend({
        appendTo:function(dom){
           //将this中的每一个成员添加到DOM中
            for (var i=0;i<this.length;i++){
                dom.appendChild(this[i]);
            }
            return this;
        }
    });*/
    //工具方法
    Itcast.extend({
        append:function(parent,element){
            parent.appendChild(element);
        },

        prepend: function (parent,element) {
            parent.insertBefore(element,parent.firstChild);
        }
    });

    Itcast.fn.extend({
        /*
        * 1.构造数据原型
        * 2.添加数据
        * 3.返回*/
        appendTo:function(selector){
            var iObj = this.constructor(selector);
            var tObj;
            var newObj = this.constructor();
            var arr = [];
            for(var i=0;i<iObj.length;i++){
                for(var j=0;j<this.length;j++){
                    tObj = i===iObj.length-1
                        ?this[j]
                        :this[j].cloneNode(true);
                    arr.push(tObj);
                    //iObj[i].appendChild(tObj);
                    Itcast.append(iObj[i],tObj);
                }
            }
            [].push.apply(newObj,arr);
            newObj.prev = this;
            return newObj;
        },

        end:function(){
            return this.prev || this;//恢复链
        },

        append:function(selector){
            this.constructor(selector).appendTo(this);
            return this;
        },

        prependTo:function(selector){
            var iObj = this.constructor(selector);
            var tObj;
            var arr = [];
            var newObj = this.constructor();
            for(var i=0;i<iObj.length;i++){
                for(var j=0;j<this.length;j++){
                    tObj = i==iObj.length-1
                        ?this[j]
                        :this[j].cloneNode(true);
                    arr.push(tObj);
                    Itcast.prepend(iObj[i],tObj);
                }
            }
            [].push.apply(newObj,arr);
            newObj.prev = this;
            return newObj;
        },

        prepend:function(selector){
            this.constructor(selector).prependTo(this);
            return this;
        }
    });

    Itcast.fn.extend({
        on:function(type,callback){
            return this.each(function(i,v){
                this.addEventListener(type,callback);
            });
        },

        off:function(type,callback){
            return this.each(function(i,v){
                this.removeEventListener(type,callback);

            })
        }
    });

    Itcast.each(("onabort,onblur,oncancel,oncanplay,oncanplaythrough,onchange,onclick,onclose,"+
    "oncontextmenu,oncuechange,ondblclick,ondrag,ondragend,ondragenter,ondragleave,"+
    "    ondragover,ondragstart,ondrop,ondurationchange,onemptied,onended,onerror,onfocus,"+
    "    oninput,oninvalid,onkeydown,onkeypress,onkeyup,onload,onloadeddata,onloadedmetadata,"+
    "    onloadstart,onmousedown,onmouseenter,onmouseleave,onmousemove,onmouseout,onmouseover,"+
    "    onmouseup,onmousewheel,onpause,onplay,onplaying,onprogress,onratechange,onreset,"+
    "    onresize,onscroll,onseeked,onseeking,onselect,onshow,onstalled,onsubmit,onsuspend,"+
    "    ontimeupdate,ontoggle,onvolumechange,onwaiting,onautocomplete,onautocompleteerror,"+
    "    onbeforecopy,onbeforecut,onbeforepaste,oncopy,oncut,onpaste,onsearch,onselectstart,"+
    "    onwheel,onwebkitfullscreenchange,onwebkitfullscreenerror").split(','),function(i,v){
        var event = v.slice(2);
        Itcast.fn[event]=function(callback){
            return this.on(event,callback);
        };
    });


    //08.23 获取样式
    Itcast.extend({
        getStyle:function(dom,name){
            if(dom.currentStyle){
                return dom.currentStyle[name];
            }else{
                return window.getComputedStyle(dom)[name];
            }
        }
    });


    Itcast.fn.extend({
        css:function(name,value){
            //1.判断value是否存在.存在的话就是设置单个样式,并且value和name都是字符串
            if(typeof value == "string" && typeof name =="string"){
                //两个参数。此时this是一个集合，我们需要遍历
                this.each(function(){
                    //this是DOM对象
                    this.style[name] = value;
                });
            }else if(typeof name == "string" &&  value == undefined){
                //一个参数name，获取样式
                //在IE下使用dom.currentStyle,非IE下使用window.getComputerStyle
                return Itcast.getStyle(this.get(0),name);
            }
            else if(typeof  name == "object" && value == undefined){
                //对象模式，设置多个样式
                this.each(function(){
                    //this是DOM对象,遍历对象
                    /*  for(var k in name){
                     this.style[k] = name[k];
                     }*/

                    //遍历对象，取出键和值
                    var that = this;
                    I.each(name,function(k,v){
                        that.style[k] = v;
                    })
                })

            }
            return this;
        }
    });


    Itcast.fn.extend({
        addClass:function(name){
            //遍历每一个DOM对象，没有该类属性就加上去
            this.each(function(){
                var value = this.className;//可以是空或者undefined
                //如果没有类名就加上
                if(!value ){
                    //没有该属性，就直接加上去
                    this.className = name;
                }else if(value.split(" ").indexOf(name) != -1){
                    //如果属性存在的话，就是将类名加上去"c  c1"
                    this.className += " "+name;
                }
            });
            return this;
        },

        removeClass:function(name){
            //如果含有就移除，没有就不管
            //应该考虑循环移除
            //当用户添加了同名的类名，就应该全部移除
            //循环移除
            this.each(function(){
                //this是DOM对象
                var value = this.className;
                //需要移除的是value中的name值
                var arr = value.split(" ");
                var tmp ;
                while((tmp= arr.indexOf(name)) != -1){
                    arr.splice(tmp,1);
                }
                //赋值给this.calssName
                this.className = arr.join(" ");
            });
            return this;
        },

        hasClass:function(name){
            //如果含有class就返回true
            /*  var res = this.map(function(v,i){
             var arr = v.className.split(' ');
             if(arr.indexOf(name) != -1){
             return true;//只有含有的时候才会返回，否则不返回
             }
             });
             return res.length>0;*/

            //2.正则方法   '\b'指的是字符边界,字符需要转译，再加上"\"
            return [].slice.call(this,0).some(function(v,i){
                return new RegExp('\\b'+name+"\\b","g").test(v.className)

            });
        },

        toggleClass:function(name){
            var that = this;
            //如果有就删除，没有就加上
            this.each(function(){
                if(that.constructor(this).hasClass(name)){
                    //有就移除
                    that.constructor(this).removeClass(name);
                }else{
                    //没有就添加
                    that.constructor(this).addClass(name);
                }
            });
            return this;
        }
    });

    //08.23 属性
    Itcast.fn.extend({
        //attr():获取匹配的元素集合中的第一个元素的属性的值或设置每一个匹配元素的一个或多个属性
       /* attribute特性
        .attr(attributeName);
            .attr(attributeName);
        .attr(attributeName,value);
            .attr(attributeName,value);
            .attr(attributes);
            .attr(attributeName,function(index,attr){})
        */
        attr:function(name,value){
            if(typeof name === "string" && typeof value === "string"){
                //设置一个属性值
                this.each(function(){
                    //dom对象
                    this.setAttribute(name,value);
                });

            }else if(typeof name === "string" && value === undefined){
                //获取属性
                return this[0].getAttribute(name);

            }else if(typeof name === "object" && value === undefined){
                //设置多个属性值
                this.each(function(){
                    for(var k in name){
                        this.setAttribute(k,name[k]);
                    }
                });
            }
            return this;
        },

        removeAttr:function(name){
            //移除属性
            if(typeof name === "string"){
                this.each(function(){
                    this.removeAttribute(name);
                })
            }
            return this;
        },


        //prop():获取匹配的元素集中第一个的属性(property)值或设置每一个匹配元素的一个或多个属性
        /*property是属性
        .prop(propertyName);
            .prop(propertyName);
        .prop(propertyName,value);
            .prop(propertyName,value);
            .prop(properties);
            .prop(propertyName,function(index,oldPropertyValue){})
        */
        prop:function(name,value){
            if(typeof name === "string" && typeof value === "function"){
                this.each(function(i,v){
                    //this是DOM对象
                    this[name] = value.call(this,i,this);
                })

            }else if(typeof name === "string" && typeof value === "boolean"){
                this.each(function(){
                    this[name] = value;
                })

            }else if(typeof name === "string" && value === undefined){
                return this[0][name];

            }else if(typeof name === "object" && value === undefined){
                this.each(function(){
                    for(var k in name){
                        this[k]=name[k];
                    }
                })
            }
            return this;
        }
    });

    Itcast.extend({
        //化归的方法
        getText:function(node,list){
            //获取子节点
            var subs = node.childNodes;
            for(var i=0;i<subs.length;i++){
                if(subs[i].nodeType === 3){
                    //文本节点，加到list
                    list.push(subs[i].nodeValue);
                }
                if(subs[i].nodeType === 1){
                    //元素,就要进行递归
                    this.getText(subs[i],list);
                }
            }

        }
    });
    Itcast.fn.extend({
        //相当于innerHTML
        html:function(html){
            //是字符串的时候
            if(typeof html === "string"){
                //遍历DOM对象
                this.each(function(){
                    this.innerHTML(html);
                });
                //没有输入的时候，获取第一个元素的HTML
            }else if(html === undefined){
                return this.get(0).innerHTML;
            }
            return this;
        },

        //相当于innerText，兼容性
        /*
         text:function(text){
         if(typeof text === "string"){
         this.each(function(){
         this.innerText = text;
         })
         }else if(text === undefined){
         return this.get(0).innerText;
         }
         return this;
         },//不考虑兼容性的innerText
         */
        //兼容早期的火狐:
        // 获取标签下的所有文本标签，
        // 设置标签中的文本标签(将原来的删除，在将新的加进去)
        text:function(text){
            if(typeof  text === "string"){
                //将之前的移除，加新的文本
                this.each(function(){
                    this.innerHTML = "";
                    this.appendChild(document.createTextNode(text));
                });
                return this;
            }else  if(typeof text === undefined){
                //没有传入，就返回text
                var res = [];
                var that = this;
                this.each(function(){
                    that.constructor.getText(this,res);
                });
                return res.join(" ");
            }
            //如果传入的不是我想要的，直接返回this，什么都不做
            return this;
        },


        //val();参数是字符串，表示标签的value属性，用于input等表单标签
        //document.getElementByTagName("input")[0].value="***",设置value
        val:function(value){
            //传入参数
            if(typeof value == "string"){
                //字符串
                this.each(function(){
                    this.value = value;
                    //等价于 I(this).attr("value",value);
                });
                //不传参,获取第0个的值
            }else if(value == undefined){
                //获取值
                return this.get(0).value;
            }
            return this;
        }
    })


    window.Itcast = window.I = Itcast;
})(window);