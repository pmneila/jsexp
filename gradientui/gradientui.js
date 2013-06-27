
(function($){
    
    var hexToRgb = function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16)/255.0,
            g: parseInt(result[2], 16)/255.0,
            b: parseInt(result[3], 16)/255.0
        } : null;
    }
    
    var clamp = function(value, min, max)
    {
        return Math.max(min, Math.min(max, value));
    }
    
    var Dragger = function(parent, position, color)
    {
        this.parent = parent;
        this.parent.$this.append('<div class="gradient-dragger"></div>');
        this.$this = parent.$this.children('.gradient-dragger:last');
        this.width = parent.$this.children('.gradient-view').width() - 7;
        this.position = position;
        this.color = color;
        this.dragging = false;
        this.moved = false;
        this.oldleft = undefined
        this.mousedownx = undefined;
        this.$this.css("left", this.position*this.width);
        this.$this.css("background-color", this.color);
        
        this.$this.bind("click.dragger", {this : this}, function(event){event.data.this.click(event)});
        this.$this.bind("mousedown.dragger", {this : this}, function(event){event.data.this.mousedown(event)});
        $(window).bind("mouseup.dragger", {this : this}, function(event){event.data.this.mouseup(event)});
        $(window).bind("mousemove.dragger", {this : this}, function(event){event.data.this.mousemove(event)});
    }
    
    Dragger.prototype.click = function(event)
    {
        if(this.moved)
            return;

        var aux = this;
        colorPicker.exportColor = function()
        {
            aux.color = '#' + colorPicker.CP.hex;
            aux.$this.css("background-color", aux.color);
            aux.parent.redraw();
        };
        
        colorPicker.expColor = false;
        colorPicker.expHEX = false;
        colorPicker.mode = 'H';
        colorPicker.objs = this.color;
        colorPicker(event);
    }
    
    Dragger.prototype.mousedown = function(event)
    {
        this.oldleft = parseInt(this.$this.css("left"), 10);
        this.mousedownx = event.pageX;
        this.dragging = true;
        this.moved = false;
    }
    
    Dragger.prototype.mouseup = function(event)
    {
        this.dragging = false;
    }
    
    Dragger.prototype.mousemove = function(event)
    {
        if(!this.dragging)
            return;
        
        var diff = event.pageX - this.mousedownx;
        var newleft = clamp(this.oldleft + diff, 0, this.width);
        
        this.position = newleft / this.width;
        this.$this.css("left", newleft);
        this.parent.redraw();

        this.moved = true;
    }
    
    Dragger.prototype.setPosition = function(pos)
    {
        pos = clamp(pos, 0.0, 1.0);
        var newleft = pos*this.width;
        
        this.$this.css("left", newleft);
        this.position = pos;
    }
    
    Dragger.prototype.setColor = function(color)
    {
        this.color = color;
        this.$this.css("background-color", color);
        this.parent.redraw();
    }
    
    var Gradient = function(parent, values)
    {
        this.$this = parent;
        
        // Disable selection.
        this.$this.get(0).onselectstart = function(){return false;};
        
        this.$this.css("position", "relative");
        this.width = this.$this.width();
        this.height = this.$this.height();
        this.$this.append('<canvas class="gradient-view"></canvas>');
        
        this.gradientview = this.$this.children('.gradient-view:first');
        this.gradientview.width(this.width);
        this.gradientview.height(this.height - 21);
        this.gradientview.css('position', 'absolute');
        this.gradientview.css('left', 0);
        
        this.canvas = this.gradientview.get(0);
        this.canvas.width = this.gradientview.width();
        this.canvas.height = this.gradientview.height();
        this.ctx = this.canvas.getContext('2d');
        
        this.draggers = [];
        for(var i=0; i < values.length; i++)
            this.draggers.push(new Dragger(this, values[i][0], values[i][1]));
        
        this.redraw();
    }
    
    Gradient.prototype.updateValues = function()
    {
        var aux = this.draggers.map(function(a){return [a.position, a.color];});
        aux.sort(function(a,b){return a[0]-b[0];});
        
        this.values = aux;
        
        if(this.callback !== undefined)
            this.callback.fn(this.callback.data);
    }
    
    Gradient.prototype.setValues = function(values)
    {
        this.values = values;
        for (var i = values.length - 1; i >= 0; i--) {
            var v = values[i];
            this.draggers[i].setPosition(v[0]);
            this.draggers[i].setColor(v[1]);
        };
    }
    
    Gradient.prototype.redraw = function()
    {
        this.updateValues();
        var values = this.values;
        
        var lingrad = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        for(var i=0; i<values.length; i++)
            lingrad.addColorStop(values[i][0], values[i][1]);
        
        this.ctx.fillStyle = lingrad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    Gradient.prototype.setUpdateCallback = function(callback, data)
    {
        this.callback = {};
        this.callback.fn = callback;
        this.callback.data = data;
    }
    
    var methods = {
        init : function(options) {
            
            var settings = $.extend( {
                  values         : [[0.2, "#FF0000"], [0.4, "#00FF00"], [0.6, "#0000FF"], [0.8, "#FFFFFF"]]
                }, options);
            
            return this.each(function(){
                var aux = new Gradient($(this), settings.values);
                $(this).data("gradient", aux);
            });
        },
        
        destroy : function() {
            return this.each(function(){
                $(window).unbind(".gradient");
            });
        },
        
        getValuesRGBS : function() {
            
            var values = $(this).data("gradient").values;
            var valuesRGBS = values.map(function(a){
                var rgb = hexToRgb(a[1]);
                return [rgb.r, rgb.g, rgb.b, a[0]]
            });
            return valuesRGBS;
        },
        
        setValues : function(values) {
            $(this).data("gradient").setValues(values);
        },
        
        getValues : function() {
            return $(this).data("gradient").values;
        },
        
        setUpdateCallback : function(callback, data) {
            $(this).data("gradient").setUpdateCallback(callback, data);
            return this;
        }
    };
    
    $.fn.gradient = function(method)
    {
        if(methods[method])
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        else if(typeof method === 'object' || !method)
            return methods.init.apply(this, arguments);
        else
            $.error('Method ' +  method + ' does not exist on gradientui');
    };
})(jQuery);
