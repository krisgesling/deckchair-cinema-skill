//@codekit-prepend core.pre.js

//@codekit-prepend scripts/events.js

//@codekit-prepend scripts/wrapper.input.js
//@codekit-prepend scripts/wrapper.checkbox.js
//@codekit-prepend scripts/wrapper.radio.js
//@codekit-prepend scripts/wrapper.select.js
//@codekit-prepend scripts/wrapper.file.js
//@codekit-prepend scripts/wrapper.star.js
//@codekit-prepend scripts/wrapper.colorpicker.js

//@codekit-prepend scripts/toggle.class.js
//@codekit-prepend scripts/toggle.collapse.js

//@codekit-prepend scripts/trigger.library.js

//@codekit-prepend scripts/action.ajax.js
//@codekit-prepend scripts/action.clock.js
//@codekit-prepend scripts/action.countdown.js
//@codekit-prepend scripts/action.embed.js
//@codekit-prepend scripts/action.facebook.js
//@codekit-prepend scripts/action.focus.js
//@codekit-prepend scripts/action.instagram.js
//@codekit-prepend scripts/action.map.js
//@codekit-prepend scripts/action.remove.js
//@codekit-prepend scripts/action.reorder.js
//@codekit-prepend scripts/action.search.js
//@codekit-prepend scripts/action.submit.js
//@codekit-prepend scripts/action.treeview.js
//@codekit-prepend scripts/action.trigger.js

//@codekit-prepend scripts/match.rows.js

//@codekit-prepend scripts/sortable.table.js

//@codekit-prepend scripts/sync.height.js

//@codekit-prependz scripts/mobile.js
//@codekit-prependz scripts/mobile.scrolllock.js

//@codekit-prepend core.post.js
/*	---------------------------------
 	IE Fixes
 	---------------------------------*/
if(typeof String.prototype.trim !== 'function') {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g, '');
	}
}
if (typeof console == 'undefined') {
	console = {
		log: function(str) {}
	};
}

(function($) {
	/*	---------------------------------
		Helper functions
		---------------------------------*/
	var supportsHTML5Upload = window.FormData !== undefined && ('upload' in ($.ajaxSettings.xhr()));

	function attr2Data(name) {
		var index;
		while ((index = name.indexOf('-')) != -1) {
			var pre = name.substring(0, index);
			var char = name.substring(index+1).toUpperCase();
			var post = (index+2 < name.length-1 ? name.substring(index+2) : '');
			name = pre+char+post;
		}
		return name;
	}

	function data2Attr(name) {
		name = name.replace(/([A-Z])/g, '-$1').toLowerCase();
		return name;
	}

	function parseQuery(url) {
		var params = url.substring(url.indexOf('?')+1).split('&');
		var data = {};
		for (var i=0; i<params.length; i++) {
			var param = params[i].split('=');
			data[param[0]] = param[1];
		}
		return data;
	}

	function applyOptions(target, options, defaults) {
		//target.removeData();
		if (options === undefined) options = {};
		if (defaults === undefined) defaults = {};
		if (typeof options == 'string') options = { target: options };
		for (var key in target.data()) {
			if (options[key] === undefined) options[key] = target.data(key);
		}
		for (var key in defaults) {
			if (options[key] === undefined) options[key] = defaults[key];
		}
		for (var key in options) {
			if (!$.isFunction(options[key])) target.attr('data-'+data2Attr(key), options[key]);
			if (typeof options[key] == 'string' && options[key].substring(0, 1) == '{') options[key] = eval('('+options[key]+')');
			target.data(attr2Data(key), options[key]);
		}
	}

	function padNum(str, width) {
		var sign = '';
		str = ''+str;
		if (str.substring(0, 1) == '-') {
			str = str.substring(0, 1);
			sign = '-';
		}
		while (str.length < width) str = '0'+str;
		return sign+str;
	}
	$.padNum = padNum;

	function stringToDate(str) {
		//IE Doesn't like parsing string dates
		if (new Date(str).toString() != 'Invalid Date') return new Date(str);
		//YYYY-MM-DD HH:MM:SS
		var parts = (/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/i).exec(str);
		var date = new Date();
		date.setFullYear(parts[1]);
		date.setMonth(parts[2]-1);
		date.setDate(parts[3]);
		date.setHours(parts[4]);
		date.setMinutes(parts[5]);
		date.setSeconds(parts[6]);

		return date;
	}
	$.stringToDate = stringToDate;

	function timeSince(date) {
		var now = new Date();
		var diff = Math.floor((now-date) / 1000);

		var diff_n = false;
		if (diff < 0) return '0 secs ago';
		else if ((diff_n = diff) < 60) return diff_n+' sec'+(diff_n == 1 ? '' : 's')+' ago';
		else if ((diff_n = Math.floor(diff / 60)) < 60) return diff_n+' min'+(diff_n == 1 ? '' : 's')+' ago';
		else if ((diff_n = Math.floor(diff / 60 / 60)) < 24) return diff_n+' hr'+(diff_n == 1 ? '' : 's')+' ago';
		else if ((diff_n = Math.floor(diff / 60 / 60 / 24)) < 7) return diff_n+' day'+(diff_n == 1 ? '' : 's')+' ago';

		diff_n = Math.floor(diff / 60 / 60 / 24 / 7);
		return diff_n+' week'+(diff_n == 1 ? '' : 's')+' ago';
	}
	$.timeSince = timeSince;

	function dateFormat(date, format) {
		var vars = [
			's', 'U', // seconds
			'i', // minutes
			'g', 'G', 'h', 'H', // hours
			'a', 'A', // am/pm
			'd', 'D', 'j', 'l', 'w', // day
			'W', // week
			'm', 'M', 'F', 'n', 't', // month
			'L', 'y', 'Y', 'z', // year
			'I', 'O', 'P', 'r', 'S', 'T', 'Z'
		];

		var hours = date.getHours();
		var ampm = 'am'; if (hours > 11) ampm = 'pm';
		var hours12 = hours > 12 ? hours-12 : (hours == 0 ? 12 : hours);
		var dateText = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
		var monthText = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()];
		var dateSuffix = 'th';
		switch(date.getDate() % 10) {
			case 1: dateSuffix = 'st'; break;
			case 2: dateSuffix = 'nd'; break;
			case 3: dateSuffix = 'rd'; break;
		}

		var gmt = padNum(Math.floor(date.getTimezoneOffset()/60), 2)+padNum(Math.abs(date.getTimezoneOffset()) % 60, 2);

		for (var i=0; i<vars.length; i++) {
			if (format.indexOf('%'+vars[i]) == -1) continue;
			switch(vars[i]) {
				case 's': format = format.replace(/%s/g, padNum(date.getSeconds(), 2)); break;
				case 'U': format = format.replace(/%U/g, date.getTime()/1000); break;

				case 'i': format = format.replace(/%i/g, padNum(date.getMinutes(), 2)); break;

				case 'g': format = format.replace(/%g/g, hours12); break;
				case 'G': format = format.replace(/%G/g, hours); break;
				case 'h': format = format.replace(/%h/g, padNum(hours12, 2)); break;
				case 'H': format = format.replace(/%H/g, padNum(hours, 2)); break;

				case 'a': format = format.replace(/%a/g, ampm); break;
				case 'A': format = format.replace(/%A/g, ampm.toUpperCase()); break;

				case 'd': format = format.replace(/%d/g, padNum(date.getDate(), 2)); break;
				case 'D': format = format.replace(/%D/g, dateText.substring(0, 3)); break;
				case 'j': format = format.replace(/%j/g, date.getDate()); break;
				case 'l': format = format.replace(/%l/g, dateText); break;
				case 'w': format = format.replace(/%w/g, date.getDay()); break;

				//case 'W': format = format.replace(/%W/g, date.getWeek()); break;

				case 'm': format = format.replace(/%m/g, padNum(date.getMonth()+1, 2)); break;
				case 'M': format = format.replace(/%M/g, monthText.substring(0, 3)); break;
				case 'F': format = format.replace(/%F/g, monthText); break;
				case 'n': format = format.replace(/%n/g, date.getMonth()+1); break;
				case 't':
					var daysInMonth = 31;
					switch(date.getMonth()+1) {
						case 2: daysInMonth = date.getFullYear()%4 ? 28 : 29; break;
						case 4:
						case 6:
						case 9:
						case 11: daysInMonth = 30; break;
					}
					format = format.replace(/%t/g, daysInMonth); break;

				case 'L': format = format.replace(/%L/g, date.getFullYear()%4 ? 1 : 0); break;
				case 'y': format = format.replace(/%y/g, date.getYear()); break;
				case 'Y': format = format.replace(/%Y/g, date.getFullYear()); break;
				//case 'z': format = format.replace(/%z/g, date.getDayOfYear()); break;

				case 'O': format = format.replace(/%O/g, gmt); break;
				case 'S': format = format.replace(/%S/g, dateSuffix); break;

				case 'r': format = format.replace(/%r/g, dateFormat(date, '%D, %j %M %Y %H:%i:%s %O')); break;
			}
		}
		return format;
	}
	$.dateFormat = dateFormat;

	function trigger(target, mode, callback) {
		var title = 'Trigger';
		if (target.data('title')) title = target.data('title');
		else if (target.is('a')) title = target.html();

		switch(target.data('libMode')) {
			case 'trigger':
				target.addClass('hide').before('<a href="#" class="library-trigger">'+title+'</a>').prev().each(function() {
				$(this).click(function(e) {
					e.preventDefault();
					//console.log('Triggered');
					$(this).remove();
					target.removeClass('hide');
					callback();
				});
			}); break;
			default: callback(); break;
		}
	}
	var activateList = [];
	function activate(selector, name, func) {
		$.fn[name] = func;
		if (!selector) return;
		activateList.push({
			name: name,
			selector: selector
		});
	}

activate('[data-event]', 'onEvent', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {});
		//console.log(target.data());
		target.on(target.data('event'), function(e) {
			var func = '(function(){'+target.data('eventHandler')+'}())';
			//console.log(func);
			eval(func);
		});
	});
});
activate('[data-wrap="input"]', 'wrapInput', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			wrap: 'input',
			onChange: function(e) {
				var value = $(this).val();
				//console.log($(this).attr('type')+' | '+value+' | '+target.val());
				/*switch($(this).attr('type')) {
					case 'number':
						var newValue = parseInt(value.replace(/[^0-9]/gi, ''));
						if (value != newValue) $(this).val(newValue);
						break;
				}*/
				//console.log(e);
				//console.log('Change: '+target.val());
			}
		});
		if (target.parents('label').length == 0) target.wrap('<label></label>');
		var label = target.parents('label');
		label.addClass('wrap-'+target.data('wrap'));
		var data = target.data();
		target.remove();
		var labelText = label.find('.wrap-label').length > 0 ? label.find('.wrap-label').text().trim() : label.text().trim();
		var elements = label.children();
		label.empty();
		label.append(elements);
		if (labelText.length > 0) label.html('<span class="wrap-label">'+labelText+' </span>');
		label.append(target);
		target.data(data);
		target.on('change', target.data('onChange'));
		target.on('focus blur', function(e) {
			target.parent().toggleClass('focus', target.is(':focus'));
		})
	});
});
activate('[data-wrap="checkbox"]', 'wrapCheckbox', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			wrap: 'checkbox',
			icon: 'check-sign',
			onChange: function(e) {
				target.parent().toggleClass('checked', target.is(':checked'));
			}
		});
		target.wrapInput().trigger('change');
		target.parent().prepend(target);
		target.parent().toggleClass('icon-'+target.data('icon'), target.data('icon') != undefined && target.data('icon') != 'none');
	});
});
activate('[data-wrap="radio"]', 'wrapRadio', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			wrap: 'radio',
			icon: 'circle',
			onChange: function(e) {
				$('[name="'+target.attr('name')+'"]').not(':checked').parent().removeClass('checked');
				target.parent().toggleClass('checked', target.is(':checked'));
			}
		});
		target.wrapInput().trigger('change');
		target.parent().prepend(target);
		target.parent().toggleClass('icon-'+target.data('icon'), target.data('icon') != undefined && target.data('icon') != 'none');
	});
});
activate('[data-wrap="select"]', 'wrapSelect', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			wrap: 'select',
			onChange: function(e) {
				target.parent().find('span.wrap-value').remove();
				target.parent().append('<span class="wrap-value">'+target.find('option:selected').text()+' <i class="icon-caret-down"></i></span>');
			}
		});
		target.wrapInput().trigger('change');
	});
});
activate('[data-wrap="file"]', 'wrapFile', function(options) {
	return this.each(function() {
		var target = $(this);

		if (!supportsHTML5Upload) {
			console.log('HTML5 Uploading not supported.');
			return;
		}

		applyOptions(target, options, {
			wrap: 'file',
			url: target.parents('form').attr('action'),
			fadeOut: true
			/*onChange: function(e) {
				target.parent().toggleClass('checked', target.is(':checked'));
			}*/
		});
		var wrap = target.wrapInput().parents('label');
		var wrapProgress = wrap.after('<div class="wrap-file-progress"></div>').next();

		wrap.on('dragenter', function(e) {
			e.stopPropagation();
			e.preventDefault();
			$(this).addClass('active');
		}).on('dragover', function(e) {
			e.stopPropagation();
			e.preventDefault();
		}).on('dragleave', function(e) {
			if ($(this).find(e.target).length == 0) $(this).removeClass('active');
		}).on('drop', function(e) {
			e.preventDefault();
			$(this).removeClass('active');
			handleUpload(e.originalEvent.dataTransfer.files);
		});
		target.after('Drop file here or<br/><button type="button" class="btn">Select File</button>')
			.siblings('button').on('click', function(e) {
			e.preventDefault();
			target.siblings('button').blur();
			target.trigger('click');
		}).on('dragenter dragover', function(e) {
			if (!wrap.is('.active')) wrap.addClass('active');
		});
		target.on('change', function(e) {
			handleUpload(this.files);
			//$(this).replaceWith($(this).clone(true));
		});

		var handleUpload = function(files) {
			wrapProgress.empty();
			for (var i=(target.attr('multiple') ? 0 : files.length-1); i<files.length; i++) {
				var data = new FormData();
				data.append(target.attr('name'), files[i]);

				wrapProgress.append('<div class="file-progress">'
					+'<a href="#" class="icon-remove remove"></a>'
					+files[i].name+' ('+(files[i].size/1024 < 1024 ? (files[i].size/1024).toFixed(2)+' KB' : (files[i].size/1024/1024).toFixed(2)+' MB')+')'
					+'<span class="bar"></span>'
				+'</div>');

				(function(data, status) {
					var jqXHR = $.ajax({
						xhr: function() {
							var xhr = $.ajaxSettings.xhr();
							if (xhr.upload) {
								xhr.upload.addEventListener('progress', function(e) {
									var position = e.loaded || e.position;
									var total = e.total;
									var percent = e.lengthComputable ? Math.ceil(position / total * 100) : 0;
									status.find('.bar').css('width', percent+'%');
								});
							}
							return xhr;
						},
						url: target.data('url') ? target.data('url') : window.location.href,
						type: 'POST',
						contentType: false,
						processData: false,
						cache: false,
						data: data,
						success: function(data, textStatus, XMLHttpRequest) {
							console.log('success');
							status.addClass('complete').find('bar').css('width', '100%');
							data['status'] = status;
							target.trigger('complete', data);
							/*if (target.data('fadeOut')) {
								status.fadeOut(1000, function() {
									status.remove();
								});
							}*/
						},
						error: function(jqHXR, textStatus, errorThrown) {
							console.log(textStatus+': '+errorThrown);
						}
					});
					status.find('.remove').on('click', function(e) {
						jqXHR.abort();
						status.fadeOut(1000, function() {
							status.remove();
						});
					});
				})(data, wrapProgress.children().last());
			}
		}
	});
});
activate('[data-input="star-rating"]', 'starRating', function() {
	return this.each(function() {
		var name = $(this).attr('name');
		var min = parseInt($(this).attr('min'));
		var max = parseInt($(this).attr('max'));
		var values = $(this).attr('value').split('|');
		var ratings = [];
		while ($(this).data('rating'+(ratings.length+1)) !== undefined) {
			ratings.push($(this).data('rating'+(ratings.length+1)));
			if (values.length < ratings.length) values.push(0);
		}
		if (ratings.length == 0) ratings = [''];

		var container = $(this).wrap('<div class="wrap-star"></div>').parent();

		var rating_max = Math.ceil(max/ratings.length);

		for (var i=0; i<ratings.length; i++) {
			var row = $('<div data-star="'+i+'">'+(ratings[i] ? '<span class="title">'+ratings[i]+'</span>' : '')+'</div>');
			for (var j=min; j<rating_max+1; j++) {
				row.prepend('<span data-value="'+j+'" class="'+(j==values[i] ? ' active' : '')+'"></span>');
			}
			container.append(row);

			var update = function(row, pos) {
				if (pos === undefined) pos = values[row.data('star')];
				row.find('span').not('.title').each(function() {
					//console.log(container.find('input').attr('name')+': '+$(this).data('value')+' | '+pos);
					$(this).toggleClass('active', $(this).data('value') <= pos);
				});
				container.find('input').val(values.join('|'));
			};

			row.find('span').click(function(e) {
				var pos = $(this).data('value');
				values[$(this).parent().data('star')] = pos;
				update($(this).parent(), pos);
			})/*.on('mouseover', function(e) {
				update($(this).parent(), $(this).data('value'));
			});
			row.on('mouseout', function(e) {
				update($(this));
			})*/;
			update(row);
		}
	});
});

activate('[data-input="star-choice"]', 'starChoice', function() {
	return this.each(function() {
		var group = $(this).data('group');
		$(this).wrap('<label class="star"></label>');
		$(this).after('<span></span>');
		$(this).change(function(e) {
			$('[data-group="'+group+'"]').not(this).removeAttr('checked').siblings('span').removeClass('active');
			$(this).siblings('span').toggleClass('active', $(this).is(':checked'));
		}).trigger('change');
	});
});
activate('[data-wrap="colorpicker"]', 'wrapColorPicker', function(options) {
	return this.each(function() {
		var target = $(this);
		//console.log('colorPickerWrap');
		applyOptions(target, options, {
			wrap: 'colorpicker',
			onChange: function(e) {
				//$('[name="'+target.attr('name')+'"]').not(':checked').parent().removeClass('checked');
				//target.parent().toggleClass('checked', target.is(':checked'));
			},
			colors: '#000,#FFF'
		});
		target.wrapInput().trigger('change');
		
		var colors = target.data('colors').split(',');
		target.wrap('<span class="swatch-wrap"></span>').after('<span class="swatch-inner"></span>');
		
		for (var i=0; i<colors.length; i++) {
			if (colors[i] == target.val()) {
				target.siblings('.swatch-inner').attr('style', 'background-color: '+colors[i]);
			}
		}
		target.on('click focus', function(e) {
			e.preventDefault();
		});
		target.parent().popover({
			html: true,
			content: function() {
				$('.swatch-wrap').not(target.parent()).popover('hide');
				var html = '';
				for(var i=0; i<colors.length; i++) {
					var selected = colors[i] == target.val() ? ' active' : '';
					html += '<a href="'+colors[i]+'" class="swatch'+selected+'" style="background-color:'+colors[i]+';">'
					+'<span class="hide">'+colors[i]+'</span>'
					+'</a>';
				}
				var swatches = $('<div class="swatches">'+html+'</div>');
				swatches.find('.swatch').on('click', function(e) {
					e.preventDefault();
					$(this).addClass('active').siblings().removeClass('active');
					target.siblings('.swatch-inner').attr('style', 'background-color: '+$(this).attr('href'));
					target.val($(this).attr('href')).parent().popover('hide');
				});
				return swatches;
			}
		});
	});
});
activate('[data-toggle-class]', 'toggleTargetClass', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {toggleClass: 'active'});
		target.click(function(e) {
			var toggleTarget = $(target.data('target'));
			if (target.data('toggleClassTarget')) toggleTarget = $(target.data('toggleClassTarget'));
			//console.log(target.data());
			var group = target.data('group');
			var cl = target.data('toggleClass');
			var toggle = toggleTarget.hasClass(cl);
			//console.log(group+' | '+cl+' | '+toggle+' | '+$('[rel="'+group+'"]').length);
			if (group) $('[rel="'+group+'"]').not(toggleTarget).addClass(cl, toggle);
			toggleTarget.toggleClass(cl);
		});
	});
});
activate('[data-toggle="toggle-collapse"]', 'toggleCollapse', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			toggle: 'toggle-collapse'
		});

		$(target.data('target')).each(function() {
			var collapse = $(this);
			var isMin = collapse.hasClass('min');
			var matches = collapse.removeClass('min').find('.collapse-height, .collapse-width').add(collapse);
			matches.addClass('init');
			setTimeout(function() {
				collapse.css('height', collapse.height()+'px').toggleClass('min', isMin);
				matches.removeClass('init');
			}, matches.length*400);
		});

		target.click(function(e) {
			e.preventDefault();
			$(target.data('target')).each(function() {
				$(this).toggleClass('in');
				$(target).toggleClass('active', !$(this).hasClass('in'));
			});
		});
		$(target).toggleClass('active', !$(target.data('target')).hasClass('in'));
	});
});
activate('[data-lib]', 'triggerLibrary', function(options) {
	return this.each(function() {
		var target = $(this);
		var callback = function() {
			applyOptions(target, options);
			var lib = target.data('lib');
			var data = target.data();
			for (var key in data) {
				if (data[key].toString().substring(0, 1) == '{') {
					data[key] = eval('('+data[key]+')');
				}
				if (data[key].toString().indexOf('javascript:') == 0) {
					data[key] = eval('('+data[key].substring(data[key].indexOf(':')+1)+')');
				}
			}
			switch(lib) {
				case 'mediaelementplayer':
					if (target.is('a')) {
						target.after('<audio>'
							+'<source src="'+target.attr('href')+'" />'
							+'<object type="application/x-shockwave-flash" data="flashmediaelement.swf">'
								+'<param name="movie" value="flashmediaelement.swf" />'
								+'<param name="flashvars" value="controls=true&amp;'+target.attr('href')+'" />'
							+'</object>'
						+'</audio>');
						target = target.next().data(target.data());
						target.prev().remove();
					}
					if (target.data('autostart')) {
						data.success = function(e, d) {
							e.play();
						};
					}
					break;
				case 'fancybox':
					if (target.attr('rel')) {
						var group = $('[rel="'+target.attr('rel')+'"]');
						if (!group.first().is(target)) return;
						target = group;
					}
					break;
				case 'flexslider':
					if (target.data('awesome')) {
						if (!target.data('awesomeName')) target.data('awesomeName', 'chevron');
						data['prevText'] = '<i class="icon-'+target.data('awesomeName')+'-left"></i>';
						data['nextText'] = '<i class="icon-'+target.data('awesomeName')+'-right"></i>';
						target.addClass('awesome');
					}
					switch(target.data('direction')) {
						case 'left':
						case 'right': target.addClass('direction-'+target.data('direction')); break;
					}
					if (target.data('minItems')) {
						target.addClass('carousel');
						target.find('li').css('max-width', target.data('itemWidth')+'px');
					}
					if (target.data('controlNavContent')) {
						data.start = function() {
							//console.log(this);
							var flexslider = target.data('flexslider');
							//console.log(flexslider);
							flexslider.controlNav.each(function() {
								//console.log($(this).text());
								var slide = $(flexslider.slides.get(parseInt($(this).text())-1)).html();
								if (slide == undefined) return;

								slide = slide.replace(/<h([0-9]+)/gi, '<h$1 class="header$1"').replace(/h[0-9]+/gi, 'span');
								slide = slide.replace(/<[\/]*a[^><]*>/gi, '');
								slide = slide.replace(/<[\/]*ul[^><]*>/gi, '');
								slide = slide.replace(/<\/li>/gi, '</li><br/>').replace(/<[\/]*li[^><]*>/gi, '');
								slide = slide.replace(/<([\/]*)div([^><]*)>/gi, '<$1span$2>');
								//console.log(slide);
								//slide = slide.replace('/h[0-9]+/gi', 'span');
								//$(this).html(slide);
								//var navData = $(this).data();

								//$(this).replaceWith('<div>'+slide.html()+'</div>').data(navData);
								$(this).html(slide);
							}).parents('.flex-control-nav').addClass('flex-control-nav-content');
							//console.log(this.data('flexslider'));
						};
					}
					break;
				case 'fullCalendar':
					var events = [];
					target.find('ul.events li').each(function() {
						events.push($(this).data());
					});
					target.data('events', events);
					break;
			}

			if ($.fn[lib] !== undefined) target[lib](data);
		};

		trigger(target, target.data('libMode'), callback);
	});
});
activate('[data-action="ajax"]', 'actionAjax', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			reload: false,
			redirect: false,
			onSuccess: function(data) {
				//if (target.data('redirect')) window.location = target.attr('href');
				var loc = window.location.href;
				if (loc.indexOf('#') != -1) loc = loc.substring(0, loc.indexOf('#'));
				if (target.data('reload')) window.location = loc;
			},
			onStart: function() {}
		});
		//console.log(target.data());

		target.on('click', function(e) {
			if (!target.data('redirect')) e.preventDefault();
			target.data('onStart').call(target);
			$.get(target.attr('href'), function(data) {
				target.data('onSuccess').call(target, data);
			});
		});
	});
});
activate('[data-action="clock"]', 'actionClock', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			format: '%d/%m/%Y %h:%i:%s%a',
			interval: 1000
		});
		setInterval(function() {
			target.text(dateFormat(new Date(), target.data('format')));
		}, target.data('interval'));
		target.addClass('clock').text(dateFormat(new Date(), target.data('format')));
	});
});
activate('[data-action="countdown"]', 'actionCountdown', function(options) {
	//console.log(this);
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			dateFrom: new Date(new Date().getTime()+(1000*60*60*24+5)),
			step: 1000
		});
		//$.extend(options, $(this).data());
		//$.extend(options, defaults);
		options = target.data();
		if (options['dateString']) {
			options['dateFrom'] = new Date(options['dateString']);
		}

		//console.log(options);

		var self = $(this);
		target.addClass('countdown');
		target.append(
			'<div class="digit-group day">'
				+'<span class="digit" digit="2"></span>'
				+'<span class="digit" digit="1"></span>'
				+'<span class="digit" digit="0"></span>'
				+'</div>'
				+'<div class="digit-group hour">'
				+'<span class="digit" digit="1"></span>'
				+'<span class="digit" digit="0"></span>'
				+'</div>'
				+'<div class="digit-group minute">'
				+'<span class="digit" digit="1"></span>'
				+'<span class="digit" digit="0"></span>'
				+'</div>'
				+'<div class="digit-group second">'
				+'<span class="digit" digit="1"></span>'
				+'<span class="digit" digit="0"></span>'
				+'</div>'
		);
		var digitDays = target.find('.day .digit');
		var digitHours = target.find('.hour .digit');
		var digitMinutes = target.find('.minute .digit');
		var digitSeconds = target.find('.second .digit');

		var update = function(target, number) {
			var digit = parseInt(target.attr('digit'));
			var ns = ''+number;
			while(ns.length < digit+1) ns = '0'+ns;
			var value = ns.substring(ns.length-(digit+1), ns.length-(digit));
			//console.log(number+' | '+digit+' | '+ns+' | '+value);
			target.attr('class', 'digit value'+value);
		};

		var step = function() {
			var dateCurrent = new Date();
			var dateDiff = options.dateFrom-dateCurrent;
			if (dateDiff <= 0) {
				//console.log('Countdown Finished');
				clearInterval(interval);
				dateDiff = 0;
			}

			var days = Math.floor(dateDiff/1000/60/60/24);
			var hours = Math.floor(dateDiff/1000/60/60)-(days*24);
			var minutes = Math.floor(dateDiff/1000/60)-(days*24*60)-(hours*60);
			var seconds = Math.floor(dateDiff/1000)-(days*24*60*60)-(hours*60*60)-(minutes*60);

			//console.log(dateCurrent+' | '+options.dateFrom+' | '+dateDiff+' | '+days+':'+hours+':'+minutes+':'+seconds);

			digitDays.each(function() {
				update($(this), days);
			});
			digitHours.each(function() {
				update($(this), hours);
			});
			digitMinutes.each(function() {
				update($(this), minutes);
			});
			digitSeconds.each(function() {
				update($(this), seconds);
			});
			target.find('.day').toggleClass('s', days != 1);
			target.find('.hour').toggleClass('s', hours != 1);
			target.find('.minute').toggleClass('s', minutes != 1);
			target.find('.second').toggleClass('s', seconds != 1);
		};

		var interval = setInterval(step, options.step);
		step();
	});
});
activate('[data-action="embed"]', 'actionEmbed', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {thumbnail: true});
		var url = target.attr('href');
		if (url.indexOf('youtu.be') != -1) {
			url = url.replace(/.*youtu.be\/(.*)/i, 'http://www.youtube.com/watch?v=$1');
		}
		if (url.indexOf('youtube') != -1) {
			url = url.replace(/.*[\?\&]v=(.*)/i, 'http://www.youtube.com/embed/$1');
			if (url.indexOf('playlist') != -1) url = url.replace(/.*[\?\&]list=(.*)/i, 'http://www.youtube.com/embed/videoseries?list=$1');

			//console.log(url);
			if (url.indexOf('embed') != -1 && url.indexOf('&') != -1) url = url.substring(0, url.indexOf('&'));
			//url = url.replace(/(.*)\&.*/i, '$1');
			//console.log(url);

			var id = url.split('/').slice(-1);
			url = url.replace('|', '');
			target.addClass('embed-youtube');

			if (target.data('autostart')) url += (url.indexOf('?') != -1 ? '&' : '?')+'autoplay=1';
			if (target.data('thumbnail')) target.prepend('<span class="image"><img src="http://img.youtube.com/vi/'+id+'/mqdefault.jpg" /><i class="icon-youtube-play icon-4x"></i></span>');
			//console.log(url);
		}
		target.on('click', function(e) {
			e.preventDefault();
			var iframe = target.after('<iframe height="'+target.find('img').height()+'" src="'+url+'" class="embed-youtube"></iframe>');
			$(this).remove();
		});
	});
});
var fbAppId = '212201348987877';
var fbInit = function(appId) {
	if ($('#fb-root').length == 0) {
		$('body').prepend(
			'<div id="fb-root"></div>'
			+'<script>'
			+'window.fbAsyncInit = function() {'
				+'$("body").trigger("facebook-init");'
			+'};'
			+'(function(d, s, id) {'
				+'var js, fjs = d.getElementsByTagName(s)[0];'
				+'if (d.getElementById(id)) return;'
				+'js = d.createElement(s); js.id = id;'
				+'js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId='+appId+'";'
				+'fjs.parentNode.insertBefore(js, fjs);'
			+'}(document, "script", "facebook-jssdk"));</script>'
		);
	}
};
var fbApi = function(callback) {
	if (typeof FB == 'undefined') {
		$('body').on('facebook-init', callback);
	} else {
		callback.call(this);
	}
};
activate('[data-action="facebook"]', 'actionFacebook', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			appId: fbAppId,
			username: 'FacebookDevelopers',
			responsive: true,
			width: 0,
			height: 0,
			colorscheme: 'light',
			faces: false,
			header: false,
			posts: true,
			border: false

		});
		target.addClass('facebook-wrapper');
		if (target.data('responsive')) target.addClass('responsive');

		// Load Facebook JavaScript SDK is it doesn't exist
		fbInit(target.data('appId'));

		target.append('<div class="fb-like-box" data-href="http://www.facebook.com/'+target.data('username')+'"'
			+(target.data('width') ? ' data-width="'+target.data('width')+'"' : '')
			+(target.data('height') ? ' data-height="'+target.data('height')+'"' : '')
			+' data-colorscheme="'+target.data('colorscheme')+'"'
			+' data-show-faces="'+target.data('faces')+'"'
			+' data-header="'+target.data('header')+'"'
			+' data-stream="'+target.data('posts')+'"'
			+' data-show-border="'+target.data('border')+'"'
		+'></div>');
	});
});
activate('[data-action="facebook-album"]', 'actionFacebookAlbum', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			appId: fbAppId,
			username: 'FacebookDevelopers',
			pageId: false,
			wrap: '<li class="span2"></li>',
			type: 'normal'
		});
		target.addClass('facebook-album-wrapper');
		if (target.data('responsive')) target.addClass('responsive');

		// Load Facebook JavaScript SDK is it doesn't exist
		fbInit(target.data('appId'));

		fbApi(function() {
			FB.api('/'+target.data('username')+'/albums', function(res) {
				console.log('API');
				console.log(res);
				for (var i=0; i<res.data.length; i++) {
					var album = res.data[i];

					if (album['count'] == 0 || album['cover_photo'] == undefined || target.data('type').split('|').indexOf(album['type']) == -1) continue;

					var cover_url = 'https://graph.facebook.com/'+album['cover_photo']+'/picture?type=album';
					target.append($(target.data('wrap')).addClass('type-'+album['type']).append('<a href="'+album['link']+'" target="_blank" class="thumbnail">'
						+'<img src="'+cover_url+'" />'
						+'<span>'+album['name']+'</span>'
					+'</a>'));
				}
			});
		});
	});
});
activate('[data-action="focus"]', 'actionFocus', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options);
		target.on('click', function(e) {
			//console.log(target.data('focusTarget')+' | '+$(target.data('focusTarget')).length);
			setTimeout(function() {
				$(target.data('focusTarget')).focus();
			}, 100);

		});
	});
});
activate('[data-action="instagram"]', 'actionInstagram', function(options) {
	return this.each(function() {
		var target = $(this);
		var params = {};
		applyOptions(target, options, {
			wrap: '<li class="span2"></li>',
			max: 5
		});

		target.addClass('instagram');

		var url = 'https://api.instagram.com/v1';

		if (target.data('tag')) {
			url += '/tags/'+target.data('tag')+'/media/recent';
		}
		/*else if (target.data('userId')) {
			url += '/users/'+target.data('userId')+'/media/recent';
		}*/
		else if (target.data('search')) {
			var search = target.data('search');
			url += '/media/search';

			var defaultLatitude = -12.472454;
			var defaultLongitude = 130.988646;

			params.lat = target.data('lat') ? target.data('lat') : defaultLatitude;
			params.lng = target.data('lng') ? target.data('lng') : defaultLongitude;
			if (target.data('maxTimestamp')) params.max_timestamp = target.data('maxTimestamp');
			if (target.data('minTimestamp')) params.min_timestamp = target.data('minTimestamp');
			if (target.data('distance')) params.distance = target.data('distance');
		}
		else {
			url += '/media/popular';
		}

		if (target.data('accessToken')) params.access_token = target.data('accessToken');
		if (target.data('clientId')) params.client_id = target.data('clientId');

		url += '?'+ $.param(params);

		//console.log(url);

		$.ajax({
			type: 'GET',
			dataType: 'jsonp',
			cache: false,
			url: url,
			success: function(res) {
				//console.log(res);
				if (res.data === undefined) {
					target.before($('<p class="text-error">'+res.meta.error_type+':<br/>'+res.meta.error_message+'</p>'));
				} else {
					for (var i=0; i<res.data.length; i++) {
						var data = res.data[i];
						if (target.data('max') >= 0 && i >= target.data('max')) break;
						var createdTime = new Date();
						if (data.caption) createdTime = new Date(parseInt(data.caption.created_time)*1000);

						var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
						var created = createdTime.getDate()+' '+months[createdTime.getMonth()]+' '+createdTime.getFullYear();
						//console.log(createdTime+' | '+data.caption.created_time+' | '+created);
						var html = '<a href="'+data.images.standard_resolution.url+'" title="'+created+'" rel="instagram" class="thumbnail"><img src="'+data.images.thumbnail.url+'" /></a>';
						target.append($(target.data('wrap')).append(html));
					}
					if ($.fn.fancybox) {
						target.find('a[rel="instagram"]').fancybox({
							helpers: {
								title: {
									type: 'inside'
								}
							}
						});
					}
				}
			}
		});
	});
});
activate('[data-action="map"]', 'actionMap', function(options) {
	var selections = this;
	selections.each(function() {
		var target = $(this);
		target.append('<div class="map-container"></div>').find('.markers').hide();

		applyOptions(target, options, {
			height: 400
		});
		target.find('.map-container').css('height', target.data('height'));
	});

	$('head').append('<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=initActionMap"></script>')
		.append('<style type="text/css">.map-container img { max-width: none; } .map-container { margin-bottom: 20px; }</style>');

	window.initActionMap = function() {
		var $gm = google.maps;
		var maps = [];
		var centers = [];
		selections.each(function() {
			var target = $(this);

			var markers = target.find('.markers a');
			var defaultLatitude = -12.462726;
			var defaultLongitude = 130.841846;

			// Parse markers
			markers.each(function(index) {
				var marker = $(this);
				var href = marker.attr('href');
				var params = parseQuery(href);

				// Google Maps 3.14+
				if (href.indexOf('/maps/place') != -1) {
					var query = href.replace(/.*\/maps\/place\/([^\/]+)\/.*/gi, '$1');
					var loc = href.replace(/[^@]+@([^\/]+)\/.*/gi, '$1');
					params = {
						q: query,
						ll: loc.substring(0, loc.lastIndexOf(',')),
						z: loc.substring(loc.lastIndexOf(',')+1, loc.length-1)
					}
				}
				var latlng = false;
				for (var key in params) {
					var value = params[key];
					switch(key) {
						case 'll':
							if (!latlng || key == 'll') latlng = value.split(',');
							break;
						case 'q': marker.data('title', decodeURIComponent(value).replace(/\+/gi, ' ')); break;
						case 'z': marker.data('zoom', parseInt(value)); break;
					}
				}
				if (latlng) {
					marker.data('latitude', parseFloat(latlng[0]));
					marker.data('longitude', parseFloat(latlng[1]));
				} else {
					$.getJSON('http://maps.googleapis.com/maps/api/geocode/json?address='+params['q']+'&sensor=true', function(data) {
						//console.log('Geocode');
						//console.log(data);
						if (data.status == 'OK') {
							var loc = data.results[0].geometry.location;
							marker.data('latitude', loc.lat);
							marker.data('longitude', loc.lng);
							marker.trigger('update');
						}
					});
				}
			});

			applyOptions(target, options, {
				zoom: 14,
				mapTypeId: 'ROADMAP',
				latitude: defaultLatitude,
				longitude: defaultLongitude,
				scrollwheel: true
			});
			//console.log(target.data());
			var container = $(this).find('.map-container');
			var map = new $gm.Map(container.get(0), {
				zoom: target.data('zoom'),
				center: new $gm.LatLng(parseFloat(target.data('latitude')), parseFloat(target.data('longitude'))),
				mapTypeId: google.maps.MapTypeId[target.data('mapTypeId')],
				scrollwheel: target.data('scrollwheel')
			});
			maps.push(map);
			centers.push(map.getCenter());

			var currentInfo = null;

			markers.on('update', function(e) {
				var index = $(this).parent().children().index($(this));
				var latlng = new $gm.LatLng($(this).data('latitude'), $(this).data('longitude'));
				if ($(this).data('marker') == undefined) {
					var marker = new $gm.Marker({
						map: map,
						position: latlng,
						title: $(this).text()
					});

					var addressUrl = $(this).attr('href');
					addressUrl = 'http://www.google.com.au/maps/place/'+encodeURIComponent($(this).data('title')).replace(/%20/gi, '+')
						+'/@'+$(this).data('latitude')+','+$(this).data('longitude')+','+$(this).data('zoom')+'z/';

					var markerInfo = new $gm.InfoWindow({
						content: '<div class="map-content">'
							+'<h4>Address:</h4>'
							+'<a href="'+addressUrl+'" target="_blank">'+$(this).text()+'</a>'
						+'</div>'
					});
					$gm.event.addListener(marker, 'click', function() {
						if (currentInfo != null) currentInfo.close();
						currentInfo = markerInfo;
						markerInfo.open(map, marker);
					});
				} else {
					var marker = $(this).data('marker');
					marker.setPosition(latlng);
				}
				if (markers.length == 1) {
					map.setCenter(latlng);
					$gm.event.trigger(map, 'resize');
				}
			}).trigger('update');
		});
		$(window).on('resize', function() {
			for(var i=0; i<maps.length; i++) {
				var map = maps[i];
				$gm.event.trigger(map, 'resize');
				map.setCenter(centers[i]);
				//console.log(centers[i]);
			}
		});
	};
	return this;
});
activate('[data-action="remove"]', 'actionRemove', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			action: 'remove'
		});

		target.click(function(e) {
			e.preventDefault();
			$(target.data('target')).fadeOut(400, function() {
				$(this).remove();
			});
		});
	});
});
activate('[data-action="reorder"]', 'actionReorder', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			action: 'reorder'
		});

		var mouseStart, touchStart, start, placeholder;
		var reorderTarget = $(target.data('target'));
		var left, top, width, height, widthPadding, heightPadding;

		if (reorderTarget.parent().css('position') == 'static') reorderTarget.parent().css('position', 'relative');

		var doStart = function(offs) {
			placeholder = reorderTarget.before('<div class="placeholder"></div>').siblings('.placeholder');

			start = offs;

			left = reorderTarget.position().left;
			top = reorderTarget.position().top;
			width = reorderTarget.width();
			height = reorderTarget.height();

			widthPadding = reorderTarget.outerWidth()-width;
			heightPadding = reorderTarget.outerHeight()-height;

			reorderTarget.css({
				'position': 'absolute',
				'left': left+'px',
				'top': top+'px',
				'width': width+'px',
				'height': height+'px'
			}).addClass('reordering');
			placeholder.css({
				'width': (width+widthPadding)+'px',
				'height': (height+heightPadding)+'px'
			});
			width += widthPadding;
			height += heightPadding;
		};
		var doMove = function(offs) {
			//console.log(start.x+','+start.y+' | '+offs.x+','+offs.y);
			var diffx = offs.x-start.x;
			var diffy = offs.y-start.y;

			// Xmin bounds
			if (diffx < -left) diffx = -left;
			// Xmax bounds
			if (width+diffx >= reorderTarget.parent().width()-left) diffx = reorderTarget.parent().width()-width-left;
			// Ymin bounds
			if (diffy < -top) diffy = -top;
			// Ymax bounds
			if (height+diffy >= reorderTarget.parent().height()-top) diffy = reorderTarget.parent().height()-height-top;

			reorderTarget.css({
				'margin-top': diffy+'px',
				'margin-left': diffx+'px'
			});

			//var pos = { left: left+diffx, top: top+diffy };
			var box = {
				left: reorderTarget.parent().offset().left,
				top: reorderTarget.parent().offset().top
			};
			var pos = {
				left: offs.x-box.left,
				top: offs.y-box.top
			};
			var dirx = pos.left-placeholder.position().left;
			var diry = pos.top-placeholder.position().top;

			var prev = placeholder.prev();
			var prevx = -prev.outerWidth()/2;
			var prevy = -prev.outerHeight()/2;

			var next = placeholder.next();
			var nextx = next.outerWidth()/2;
			var nexty = next.outerHeight()/2;

			/*console.log('pos: '+pos.left+','+pos.top
				//+' | offs: '+offs.left+','+offs.top
				+' | diff: '+diffx+','+diffy
				+' | dir: '+dirx+','+diry
				+' | prev: '+prevx+','+prevy
				+' | next: '+nextx+','+nexty
				+' | '+(dirx < prevx || diry < prevy ? 'before' : '')+(dirx > nextx || diry > nexty ? 'after' : ''));*/

			if (dirx < prevx || diry < prevy) {
				//console.log('before');
				prev.before(placeholder);
			} else if (dirx > nextx || diry > nexty) {
				//console.log('after');
				next.after(placeholder);
			}
		};
		var doEnd = function() {
			start = false;
			//mouseStart = false;
			//touchStart = false;
			if (placeholder) {
				placeholder.before(reorderTarget);
				placeholder.remove();
			}
			reorderTarget.removeAttr('style').removeClass('reordering');

			target.trigger('complete');
		};

		target.on('mousedown', function(e) {
			e.preventDefault();
			if (e.which != 1) return;
			doStart({x: e.pageX, y: e.pageY});
		}).on('touchstart', function(e) {
			e.preventDefault();
			var touch = e.originalEvent.touches[0];
			if (!start) doStart({x: touch.pageX, y: touch.pageY});
		}).on('touchmove', function(e) {
			if (!start) return;
			e.preventDefault();
			var touch = e.originalEvent.touches[0];
			doMove({x: touch.pageX, y: touch.pageY});
		}).on('touchend', function(e) {
			doEnd();
		});

		$(document).on('mousemove', function(e) {
			if (!start) return;
			doMove({x: e.pageX, y: e.pageY});
		}).on('mouseup', function(e) {
			doEnd();
		});
	});
});
activate('[data-action="search"]', 'actionSearch', function(options) {
	return this.each(function() {
		var target = $(this);

		var defaults = {
			formMethod: 'get',
			formInput: 'q',
			formInputPlaceholder: 'search site...',
			keyboard: true
		};
		if (target.attr('data-form') == 'wordpress') {
			defaults.formAction = '/';
			defaults.formInput = 's';
		}

		applyOptions(target, options, defaults);

		target.wrap('<div class="search-wrapper"></div>');
		var content = '<form action="'+target.data('formAction')+'" method="'+target.data('formMethod')+'">'
			+'<input name="'+target.data('formInput')+'" type="search" placeholder="'+target.data('formInputPlaceholder')+'" />'
		+'</form>';

		if (target.data('contentTarget') != undefined) content = $('<div></div>').append($(target.data('contentTarget'))).html();
		if ($('.search-backdrop').length == 0) $('body').append('<div class="search-backdrop"></div>');
		$('.search-backdrop').on('click', function(e) {
			target.trigger('click');
		});

		target.on('click', function(e) {
			e.preventDefault();
			$('.search-backdrop').toggleClass('in');
			if ($('.search-backdrop').is('.in')) {
				setTimeout(function() {
					target.parent().find('input').focus();
				}, 100);
			}

		}).popover({
			html: true,
			placement: 'left',
			content: content
		});

		if (target.data('keyboard')) {
			$('body').on('keydown', function(e) {
				if (e.keyCode == 83 && !$('.search-backdrop').is('.in') && $(':focus').length == 0) {
					target.trigger('click');
				}
			});
		}
	});
});
activate('[data-action="submit"]', 'actionSubmit', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			action: 'submit',
			target: target.attr('href'),
			ajax: true,
			redirect: false,
			onStart: function(data) {},
			onSuccess: function(data) {}
		});
		//console.log(target.data());

		var forms = target.is('form') ? target : $(target.data('target'));
		if (forms.length == 0) forms = target.parents('form');
		var formCount = 0;
		var formTotal = forms.length;
		forms.each(function() {
			var form = $(this);
			if (target.data('formAction')) form.attr('action', target.data('formAction'));
			form.submit(function(e) {
				if (target.data('ajax')) e.preventDefault();
				if (target.data('onStart') !== undefined) target.data('onStart').call(form);
				$.post(form.attr('action'), form.serialize(), function(data) {
					formCount++;
					if (target.data('onSuccess') !== undefined) target.data('onSuccess').call(form, data);
					if (formCount == formTotal && target.data('redirect')) {
						var loc = window.location.href;
						window.location = loc.indexOf('#') != -1 ? loc.substring(0, loc.indexOf('#')) : loc;
					}
				});
			});
		});

		target.not('form').click(function(e) {
			e.preventDefault();
			forms.submit();
		});
	});
});
activate('[data-action="treeview"]', 'actionTreeview', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {expand: 'first'});
		target.addClass('treeview');
		target.find('li').each(function() {
			if ($(this).children('ul').length == 0) {
				$(this).prepend('<span class="leaf empty"></span>');
				return;
			}
			$(this).prepend('<a href="#" class="leaf"></a>').children().first().on('click', function(e) {
				e.preventDefault();
				$(this).parent().toggleClass('open');
			});
		});
		switch(target.data('expand')) {
			case 'first': target.children().first().addClass('open'); break;
			case 'all': target.find('li').addClass('open'); break;
		}
	});
});
activate('[action="trigger"]', 'actionTrigger', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {
			action: 'remove',
			trigger: 'click'
		});
		//console.log(target.data());
		target.click(function(e) {
			e.preventDefault();
			$(target.data('target')).trigger(target.data('trigger'));
		});
	});
});
activate('[data-match="rows"]', 'matchRows', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {});
		console.log(target.data());

		target.on('keyup', function(e) {
			//if (e.keyCode == 13) {
				$(this).attr('rows', $(this).val().split('\n').length);
			//}
		});
	});
});
activate('[data-sortable="table"]', 'sortableTable', function(options) {
	return this.each(function() {
		var target = $(this);
		applyOptions(target, options, {format: 'string', sort: 'asc', ignoreCase: true});

		target.find('thead tr').first().children().each(function(index) {
			var targetHead = $(this);
			applyOptions(targetHead, {}, {sortable: true, index: index, format: target.data('format')});
			if (targetHead.data('sortable')) {
				var sort = target.data('sort') == 'desc' ? 'up' : 'down';
				var html = '<a href="#" class="sort-option">'
					+targetHead.text().trim()
					+' <i class="icon-caret-'+(targetHead.is('.active') ? sort : 'none')+'"></i>'
					+'</a>';
				targetHead.html(html).find('a').on('click', function(e) {
					e.preventDefault();
					target.find('thead .sort-option').each(function() {
						if ($(this).parent().is(targetHead)) {
							sort = $(this).find('i').hasClass('icon-caret-down');
							target.find('tbody').append(target.find('tbody tr').sort(function(a, b) {
								var cella = $(a).children().removeClass('active').eq(targetHead.data('index')).addClass('active');
								var cellb = $(b).children().removeClass('active').eq(targetHead.data('index')).addClass('active');
								var dir = sort ? -1 : 1;
								//console.log(targetHead.data('format')+'\n'+cella.text()+'\n'+cellb.text());
								var test = 0;
								switch(targetHead.data('format')) {
									case 'number': test = parseFloat(cella.text()) - parseFloat(cellb.text()); break;
									case 'date':
										var datea = new Date(cella.data('value') !== undefined ? cella.data('value') : cella.text());
										var dateb = new Date(cellb.data('value') !== undefined ? cellb.data('value') : cellb.text());
										console.log(datea);
										console.log(dateb);
										console.log('==');
										test = datea.getTime() - dateb.getTime();
										break;
									case 'string':default: test = cella.text().localeCompare(cellb.text()); break;
								}
								return dir * test;
							}));

							$(this).parent().addClass('active');
							$(this).find('i').attr('class', 'icon-caret-'+(sort ? 'up' : 'down'));
						} else {
							$(this).parent().removeClass('active');
							$(this).find('i').attr('class', 'icon-caret-none');
						}
					});
				});
			}
		});
	});
});
activate('[data-sync="height"]', 'syncHeight', function(options) {
	return this.each(function() {
		var target = $(this);
		var func = function() {
			var targets = $(target.data('syncTarget'));
			targets.add(target).each(function() {
				$(this).css('height', 'auto').removeAttr('height');
			});
			var height = target.height();
			//console.log(height+' | '+target.data('syncTarget')+' | '+targets.length);
			targets.each(function() {
				if ($(this).height() > height) height = $(this).height();
			});
			targets.add(target).css('height', height)/*.each(function() {
				if ($(this).attr('height') !== undefined) $(this).attr('height', height);
				else $(this).css('height', height);
			})*/;
		};
		applyOptions(target, options);
		//setTimeout(function() {
			func();
		//}, 1);
	});
});
	$(document).ready(function() {
		for(var key in activateList) {
			var a = activateList[key];
			//console.log(key+' | '+ a.name+' | '+ a.selector);
			$(a.selector)[a.name]();
		}
	});
})(window.jQuery);
//@codekit-append 'bootstrap-master/js/bootstrap-transition.js'
//@codekit-append 'bootstrap-master/js/bootstrap-alert.js'
//@codekit-append 'bootstrap-master/js/bootstrap-button.js'
//@codekit-append 'bootstrap-master/js/bootstrap-carousel.js'
//@codekit-append 'bootstrap-master/js/bootstrap-collapse.js'
//@codekit-append 'bootstrap-master/js/bootstrap-dropdown.js'
//@codekit-append 'bootstrap-master/js/bootstrap-modal.js'
//@codekit-append 'bootstrap-master/js/bootstrap-scrollspy.js'
//@codekit-append 'bootstrap-master/js/bootstrap-tab.js'
//@codekit-append 'bootstrap-master/js/bootstrap-tooltip.js'
//@codekit-append 'bootstrap-master/js/bootstrap-popover.js'
//@codekit-append 'bootstrap-master/js/bootstrap-typehead.js'
//@codekit-append 'bootstrap-master/js/bootstrap-affix.js'
//@codekit-prepend ../_lib/rb_functions/functions.js
//@codekit-prepend ../_lib/bootstrap.js

$(document).ready(function() {
	$('#subscribe form').submit(function(e) {
		$('#subscribe').modal('hide');
	});
});
/* ===================================================
 * bootstrap-transition.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


  /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
   * ======================================================= */

  $(function () {

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd otransitionend'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-alert.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#alerts
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* ALERT CLASS DEFINITION
  * ====================== */

  var dismiss = '[data-dismiss="alert"]'
    , Alert = function (el) {
        $(el).on('click', dismiss, this.close)
      }

  Alert.prototype.close = function (e) {
    var $this = $(this)
      , selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = $(selector)

    e && e.preventDefault()

    $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

    $parent.trigger(e = $.Event('close'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      $parent
        .trigger('closed')
        .remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent.on($.support.transition.end, removeElement) :
      removeElement()
  }


 /* ALERT PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.alert

  $.fn.alert = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('alert')
      if (!data) $this.data('alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.alert.Constructor = Alert


 /* ALERT NO CONFLICT
  * ================= */

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


 /* ALERT DATA-API
  * ============== */

  $(document).on('click.alert.data-api', dismiss, Alert.prototype.close)

}(window.jQuery);
/* ============================================================
 * bootstrap-button.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#buttons
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var Button = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.button.defaults, options)
  }

  Button.prototype.setState = function (state) {
    var d = 'disabled'
      , $el = this.$element
      , data = $el.data()
      , val = $el.is('input') ? 'val' : 'html'

    state = state + 'Text'
    data.resetText || $el.data('resetText', $el[val]())

    $el[val](data[state] || this.options[state])

    // push to event loop to allow forms to submit
    setTimeout(function () {
      state == 'loadingText' ?
        $el.addClass(d).attr(d, d) :
        $el.removeClass(d).removeAttr(d)
    }, 0)
  }

  Button.prototype.toggle = function () {
    var $parent = this.$element.closest('[data-toggle="buttons-radio"]')

    $parent && $parent
      .find('.active')
      .removeClass('active')

    this.$element.toggleClass('active')
  }


 /* BUTTON PLUGIN DEFINITION
  * ======================== */

  var old = $.fn.button

  $.fn.button = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('button')
        , options = typeof option == 'object' && option
      if (!data) $this.data('button', (data = new Button(this, options)))
      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  $.fn.button.defaults = {
    loadingText: 'loading...'
  }

  $.fn.button.Constructor = Button


 /* BUTTON NO CONFLICT
  * ================== */

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


 /* BUTTON DATA-API
  * =============== */

  $(document).on('click.button.data-api', '[data-toggle^=button]', function (e) {
    var $btn = $(e.target)
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
    $btn.button('toggle')
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-carousel.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#carousel
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* CAROUSEL CLASS DEFINITION
  * ========================= */

  var Carousel = function (element, options) {
    this.$element = $(element)
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options = options
    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
  }

  Carousel.prototype = {

    cycle: function (e) {
      if (!e) this.paused = false
      if (this.interval) clearInterval(this.interval);
      this.options.interval
        && !this.paused
        && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
      return this
    }

  , getActiveIndex: function () {
      this.$active = this.$element.find('.item.active')
      this.$items = this.$active.parent().children()
      return this.$items.index(this.$active)
    }

  , to: function (pos) {
      var activeIndex = this.getActiveIndex()
        , that = this

      if (pos > (this.$items.length - 1) || pos < 0) return

      if (this.sliding) {
        return this.$element.one('slid', function () {
          that.to(pos)
        })
      }

      if (activeIndex == pos) {
        return this.pause().cycle()
      }

      return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]))
    }

  , pause: function (e) {
      if (!e) this.paused = true
      if (this.$element.find('.next, .prev').length && $.support.transition.end) {
        this.$element.trigger($.support.transition.end)
        this.cycle(true)
      }
      clearInterval(this.interval)
      this.interval = null
      return this
    }

  , next: function () {
      if (this.sliding) return
      return this.slide('next')
    }

  , prev: function () {
      if (this.sliding) return
      return this.slide('prev')
    }

  , slide: function (type, next) {
      var $active = this.$element.find('.item.active')
        , $next = next || $active[type]()
        , isCycling = this.interval
        , direction = type == 'next' ? 'left' : 'right'
        , fallback  = type == 'next' ? 'first' : 'last'
        , that = this
        , e

      this.sliding = true

      isCycling && this.pause()

      $next = $next.length ? $next : this.$element.find('.item')[fallback]()

      e = $.Event('slide', {
        relatedTarget: $next[0]
      , direction: direction
      })

      if ($next.hasClass('active')) return

      if (this.$indicators.length) {
        this.$indicators.find('.active').removeClass('active')
        this.$element.one('slid', function () {
          var $nextIndicator = $(that.$indicators.children()[that.getActiveIndex()])
          $nextIndicator && $nextIndicator.addClass('active')
        })
      }

      if ($.support.transition && this.$element.hasClass('slide')) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $next.addClass(type)
        $next[0].offsetWidth // force reflow
        $active.addClass(direction)
        $next.addClass(direction)
        this.$element.one($.support.transition.end, function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () { that.$element.trigger('slid') }, 0)
        })
      } else {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $active.removeClass('active')
        $next.addClass('active')
        this.sliding = false
        this.$element.trigger('slid')
      }

      isCycling && this.cycle()

      return this
    }

  }


 /* CAROUSEL PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.carousel

  $.fn.carousel = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('carousel')
        , options = $.extend({}, $.fn.carousel.defaults, typeof option == 'object' && option)
        , action = typeof option == 'string' ? option : options.slide
      if (!data) $this.data('carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  $.fn.carousel.defaults = {
    interval: 5000
  , pause: 'hover'
  }

  $.fn.carousel.Constructor = Carousel


 /* CAROUSEL NO CONFLICT
  * ==================== */

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }

 /* CAROUSEL DATA-API
  * ================= */

  $(document).on('click.carousel.data-api', '[data-slide], [data-slide-to]', function (e) {
    var $this = $(this), href
      , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      , options = $.extend({}, $target.data(), $this.data())
      , slideIndex

    $target.carousel(options)

    if (slideIndex = $this.attr('data-slide-to')) {
      $target.data('carousel').pause().to(slideIndex).cycle()
    }

    e.preventDefault()
  })

}(window.jQuery);
/* =============================================================
 * bootstrap-collapse.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

  var Collapse = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options.parent) {
      this.$parent = $(this.options.parent)
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension
        , scroll
        , actives
        , hasData

      if (this.transitioning || this.$element.hasClass('in')) return

      dimension = this.dimension()
      scroll = $.camelCase(['scroll', dimension].join('-'))
      actives = this.$parent && this.$parent.find('> .accordion-group > .in')

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        if (hasData && hasData.transitioning) return
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', $.Event('show'), 'shown')
      $.support.transition && this.$element[dimension](this.$element[0][scroll])
    }

  , hide: function () {
      var dimension
      if (this.transitioning || !this.$element.hasClass('in')) return
      dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', $.Event('hide'), 'hidden')
      this.$element[dimension](0)
    }

  , reset: function (size) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function (method, startEvent, completeEvent) {
      var that = this
        , complete = function () {
            if (startEvent.type == 'show') that.reset()
            that.transitioning = 0
            that.$element.trigger(completeEvent)
          }

      this.$element.trigger(startEvent)

      if (startEvent.isDefaultPrevented()) return

      this.transitioning = 1

      this.$element[method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
    }

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* COLLAPSE PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.collapse

  $.fn.collapse = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = $.extend({}, $.fn.collapse.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSE NO CONFLICT
  * ==================== */

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


 /* COLLAPSE DATA-API
  * ================= */

  $(document).on('click.collapse.data-api', '[data-toggle=collapse]', function (e) {
    var $this = $(this), href
      , target = $this.attr('data-target')
        || e.preventDefault()
        || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
      , option = $(target).data('collapse') ? 'toggle' : $this.data()
    $this[$(target).hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
    $(target).collapse(option)
  })

}(window.jQuery);
/* ============================================================
 * bootstrap-dropdown.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle=dropdown]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function (e) {
      var $this = $(this)
        , $parent
        , isActive

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) {
        if ('ontouchstart' in document.documentElement) {
          // if mobile we we use a backdrop because click events don't delegate
          $('<div class="dropdown-backdrop"/>').insertBefore($(this)).on('click', clearMenus)
        }
        $parent.toggleClass('open')
      }

      $this.focus()

      return false
    }

  , keydown: function (e) {
      var $this
        , $items
        , $active
        , $parent
        , isActive
        , index

      if (!/(38|40|27)/.test(e.keyCode)) return

      $this = $(this)

      e.preventDefault()
      e.stopPropagation()

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      if (!isActive || (isActive && e.keyCode == 27)) {
        if (e.which == 27) $parent.find(toggle).focus()
        return $this.click()
      }

      $items = $('[role=menu] li:not(.divider):visible a', $parent)

      if (!$items.length) return

      index = $items.index($items.filter(':focus'))

      if (e.keyCode == 38 && index > 0) index--                                        // up
      if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
      if (!~index) index = 0

      $items
        .eq(index)
        .focus()
    }

  }

  function clearMenus() {
    $('.dropdown-backdrop').remove()
    $(toggle).each(function () {
      getParent($(this)).removeClass('open')
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = selector && $(selector)

    if (!$parent || !$parent.length) $parent = $this.parent()

    return $parent
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  var old = $.fn.dropdown

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


 /* DROPDOWN NO CONFLICT
  * ==================== */

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(document)
    .on('click.dropdown.data-api', clearMenus)
    .on('click.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
    .on('keydown.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)

}(window.jQuery);

/* =========================================================
 * bootstrap-modal.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


!function ($) {

  "use strict"; // jshint ;_;


 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function (element, options) {
    this.options = options
    this.$element = $(element)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
    this.options.remote && this.$element.find('.modal-body').load(this.options.remote)
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this
          , e = $.Event('show')

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        this.isShown = true

        this.escape()

        this.backdrop(function () {
          var transition = $.support.transition && that.$element.hasClass('fade')

          if (!that.$element.parent().length) {
            that.$element.appendTo(document.body) //don't move modals dom position
          }

          that.$element.show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element
            .addClass('in')
            .attr('aria-hidden', false)

          that.enforceFocus()

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.focus().trigger('shown') }) :
            that.$element.focus().trigger('shown')

        })
      }

    , hide: function (e) {
        e && e.preventDefault()

        var that = this

        e = $.Event('hide')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        this.escape()

        $(document).off('focusin.modal')

        this.$element
          .removeClass('in')
          .attr('aria-hidden', true)

        $.support.transition && this.$element.hasClass('fade') ?
          this.hideWithTransition() :
          this.hideModal()
      }

    , enforceFocus: function () {
        var that = this
        $(document).on('focusin.modal', function (e) {
          if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
            that.$element.focus()
          }
        })
      }

    , escape: function () {
        var that = this
        if (this.isShown && this.options.keyboard) {
          this.$element.on('keyup.dismiss.modal', function ( e ) {
            e.which == 27 && that.hide()
          })
        } else if (!this.isShown) {
          this.$element.off('keyup.dismiss.modal')
        }
      }

    , hideWithTransition: function () {
        var that = this
          , timeout = setTimeout(function () {
              that.$element.off($.support.transition.end)
              that.hideModal()
            }, 500)

        this.$element.one($.support.transition.end, function () {
          clearTimeout(timeout)
          that.hideModal()
        })
      }

    , hideModal: function () {
        var that = this
        this.$element.hide()
        this.backdrop(function () {
          that.removeBackdrop()
          that.$element.trigger('hidden')
        })
      }

    , removeBackdrop: function () {
        this.$backdrop && this.$backdrop.remove()
        this.$backdrop = null
      }

    , backdrop: function (callback) {
        var that = this
          , animate = this.$element.hasClass('fade') ? 'fade' : ''

        if (this.isShown && this.options.backdrop) {
          var doAnimate = $.support.transition && animate

          this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
            .appendTo(document.body)

          this.$backdrop.click(
            this.options.backdrop == 'static' ?
              $.proxy(this.$element[0].focus, this.$element[0])
            : $.proxy(this.hide, this)
          )

          if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

          this.$backdrop.addClass('in')

          if (!callback) return

          doAnimate ?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (!this.isShown && this.$backdrop) {
          this.$backdrop.removeClass('in')

          $.support.transition && this.$element.hasClass('fade')?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (callback) {
          callback()
        }
      }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.modal

  $.fn.modal = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL NO CONFLICT
  * ================= */

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


 /* MODAL DATA-API
  * ============== */

  $(document).on('click.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this)
      , href = $this.attr('href')
      , $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
      , option = $target.data('modal') ? 'toggle' : $.extend({ remote:!/#/.test(href) && href }, $target.data(), $this.data())

    e.preventDefault()

    $target
      .modal(option)
      .one('hide', function () {
        $this.focus()
      })
  })

}(window.jQuery);

/* =============================================================
 * bootstrap-scrollspy.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#scrollspy
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* SCROLLSPY CLASS DEFINITION
  * ========================== */

  function ScrollSpy(element, options) {
    var process = $.proxy(this.process, this)
      , $element = $(element).is('body') ? $(window) : $(element)
      , href
    this.options = $.extend({}, $.fn.scrollspy.defaults, options)
    this.$scrollElement = $element.on('scroll.scroll-spy.data-api', process)
    this.selector = (this.options.target
      || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      || '') + ' .nav li > a'
    this.$body = $('body')
    this.refresh()
    this.process()
  }

  ScrollSpy.prototype = {

      constructor: ScrollSpy

    , refresh: function () {
        var self = this
          , $targets

        this.offsets = $([])
        this.targets = $([])

        $targets = this.$body
          .find(this.selector)
          .map(function () {
            var $el = $(this)
              , href = $el.data('target') || $el.attr('href')
              , $href = /^#\w/.test(href) && $(href)
            return ( $href
              && $href.length
              && [[ $href.position().top + (!$.isWindow(self.$scrollElement.get(0)) && self.$scrollElement.scrollTop()), href ]] ) || null
          })
          .sort(function (a, b) { return a[0] - b[0] })
          .each(function () {
            self.offsets.push(this[0])
            self.targets.push(this[1])
          })
      }

    , process: function () {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
          , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
          , maxScroll = scrollHeight - this.$scrollElement.height()
          , offsets = this.offsets
          , targets = this.targets
          , activeTarget = this.activeTarget
          , i

        if (scrollTop >= maxScroll) {
          return activeTarget != (i = targets.last()[0])
            && this.activate ( i )
        }

        for (i = offsets.length; i--;) {
          activeTarget != targets[i]
            && scrollTop >= offsets[i]
            && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
            && this.activate( targets[i] )
        }
      }

    , activate: function (target) {
        var active
          , selector

        this.activeTarget = target

        $(this.selector)
          .parent('.active')
          .removeClass('active')

        selector = this.selector
          + '[data-target="' + target + '"],'
          + this.selector + '[href="' + target + '"]'

        active = $(selector)
          .parent('li')
          .addClass('active')

        if (active.parent('.dropdown-menu').length)  {
          active = active.closest('li.dropdown').addClass('active')
        }

        active.trigger('activate')
      }

  }


 /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

  var old = $.fn.scrollspy

  $.fn.scrollspy = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('scrollspy')
        , options = typeof option == 'object' && option
      if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.scrollspy.Constructor = ScrollSpy

  $.fn.scrollspy.defaults = {
    offset: 10
  }


 /* SCROLLSPY NO CONFLICT
  * ===================== */

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


 /* SCROLLSPY DATA-API
  * ================== */

  $(window).on('load', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      $spy.scrollspy($spy.data())
    })
  })

}(window.jQuery);
/* ========================================================
 * bootstrap-tab.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TAB CLASS DEFINITION
  * ==================== */

  var Tab = function (element) {
    this.element = $(element)
  }

  Tab.prototype = {

    constructor: Tab

  , show: function () {
      var $this = this.element
        , $ul = $this.closest('ul:not(.dropdown-menu)')
        , selector = $this.attr('data-target')
        , previous
        , $target
        , e

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      if ( $this.parent('li').hasClass('active') ) return

      previous = $ul.find('.active:last a')[0]

      e = $.Event('show', {
        relatedTarget: previous
      })

      $this.trigger(e)

      if (e.isDefaultPrevented()) return

      $target = $(selector)

      this.activate($this.parent('li'), $ul)
      this.activate($target, $target.parent(), function () {
        $this.trigger({
          type: 'shown'
        , relatedTarget: previous
        })
      })
    }

  , activate: function ( element, container, callback) {
      var $active = container.find('> .active')
        , transition = callback
            && $.support.transition
            && $active.hasClass('fade')

      function next() {
        $active
          .removeClass('active')
          .find('> .dropdown-menu > .active')
          .removeClass('active')

        element.addClass('active')

        if (transition) {
          element[0].offsetWidth // reflow for transition
          element.addClass('in')
        } else {
          element.removeClass('fade')
        }

        if ( element.parent('.dropdown-menu') ) {
          element.closest('li.dropdown').addClass('active')
        }

        callback && callback()
      }

      transition ?
        $active.one($.support.transition.end, next) :
        next()

      $active.removeClass('in')
    }
  }


 /* TAB PLUGIN DEFINITION
  * ===================== */

  var old = $.fn.tab

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tab')
      if (!data) $this.data('tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


 /* TAB NO CONFLICT
  * =============== */

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


 /* TAB DATA-API
  * ============ */

  $(document).on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
    e.preventDefault()
    $(this).tab('show')
  })

}(window.jQuery);
/* ===========================================================
 * bootstrap-tooltip.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut
        , triggers
        , trigger
        , i

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      triggers = this.options.trigger.split(' ')

      for (i = triggers.length; i--;) {
        trigger = triggers[i]
        if (trigger == 'click') {
          this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
        } else if (trigger != 'manual') {
          eventIn = trigger == 'hover' ? 'mouseenter' : 'focus'
          eventOut = trigger == 'hover' ? 'mouseleave' : 'blur'
          this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
          this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
        }
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, this.$element.data(), options)

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var defaults = $.fn[this.type].defaults
        , options = {}
        , self

      this._options && $.each(this._options, function (key, value) {
        if (defaults[key] != value) options[key] = value
      }, this)

      self = $(e.currentTarget)[this.type](options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp
        , e = $.Event('show')

      if (this.hasContent() && this.enabled) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        $tip
          .detach()
          .css({ top: 0, left: 0, display: 'block' })

        this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

        pos = this.getPosition()

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        this.applyPlacement(tp, placement)
        this.$element.trigger('shown')
      }
    }

  , applyPlacement: function(offset, placement){
      var $tip = this.tip()
        , width = $tip[0].offsetWidth
        , height = $tip[0].offsetHeight
        , actualWidth
        , actualHeight
        , delta
        , replace

      $tip
        .offset(offset)
        .addClass(placement)
        .addClass('in')

      actualWidth = $tip[0].offsetWidth
      actualHeight = $tip[0].offsetHeight

      if (placement == 'top' && actualHeight != height) {
        offset.top = offset.top + height - actualHeight
        replace = true
      }

      if (placement == 'bottom' || placement == 'top') {
        delta = 0

        if (offset.left < 0){
          delta = offset.left * -2
          offset.left = 0
          $tip.offset(offset)
          actualWidth = $tip[0].offsetWidth
          actualHeight = $tip[0].offsetHeight
        }

        this.replaceArrow(delta - width + actualWidth, actualWidth, 'left')
      } else {
        this.replaceArrow(actualHeight - height, actualHeight, 'top')
      }

      if (replace) $tip.offset(offset)
    }

  , replaceArrow: function(delta, dimension, position){
      this
        .arrow()
        .css(position, delta ? (50 * (1 - delta / dimension) + "%") : '')
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()
        , e = $.Event('hide')

      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).detach()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.detach()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.detach()

      this.$element.trigger('hidden')

      return this
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function () {
      var el = this.$element[0]
      return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : {
        width: el.offsetWidth
      , height: el.offsetHeight
      }, this.$element.offset())
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , arrow: function(){
      return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow")
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function (e) {
      var self = e ? $(e.currentTarget)[this.type](this._options).data(this.type) : this
      self.tip().hasClass('in') ? self.hide() : self.show()
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  var old = $.fn.tooltip

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover focus'
  , title: ''
  , delay: 0
  , html: false
  , container: false
  }


 /* TOOLTIP NO CONFLICT
  * =================== */

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(window.jQuery);

/* ===========================================================
 * bootstrap-popover.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* POPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }


  /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

    constructor: Popover

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()
        , content = this.getContent()

      $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
      $tip.find('.popover-content')[this.options.html ? 'html' : 'text'](content)

      $tip.removeClass('fade top bottom left right in')
    }

  , hasContent: function () {
      return this.getTitle() || this.getContent()
    }

  , getContent: function () {
      var content
        , $e = this.$element
        , o = this.options

      content = (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)
        || $e.attr('data-content')

      return content
    }

  , tip: function () {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
      }
      return this.$tip
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  })


 /* POPOVER PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.popover

  $.fn.popover = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('popover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.popover.Constructor = Popover

  $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
    placement: 'right'
  , trigger: 'click'
  , content: ''
  , template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


 /* POPOVER NO CONFLICT
  * =================== */

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(window.jQuery);


/* ==========================================================
 * bootstrap-affix.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#affix
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* AFFIX CLASS DEFINITION
  * ====================== */

  var Affix = function (element, options) {
    this.options = $.extend({}, $.fn.affix.defaults, options)
    this.$window = $(window)
      .on('scroll.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.affix.data-api',  $.proxy(function () { setTimeout($.proxy(this.checkPosition, this), 1) }, this))
    this.$element = $(element)
    this.checkPosition()
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var scrollHeight = $(document).height()
      , scrollTop = this.$window.scrollTop()
      , position = this.$element.offset()
      , offset = this.options.offset
      , offsetBottom = offset.bottom
      , offsetTop = offset.top
      , reset = 'affix affix-top affix-bottom'
      , affix

    if (typeof offset != 'object') offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function') offsetTop = offset.top()
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom()

    affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ?
      false    : offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ?
      'bottom' : offsetTop != null && scrollTop <= offsetTop ?
      'top'    : false

    if (this.affixed === affix) return

    this.affixed = affix
    this.unpin = affix == 'bottom' ? position.top - scrollTop : null

    this.$element.removeClass(reset).addClass('affix' + (affix ? '-' + affix : ''))
  }


 /* AFFIX PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.affix

  $.fn.affix = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('affix')
        , options = typeof option == 'object' && option
      if (!data) $this.data('affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.affix.Constructor = Affix

  $.fn.affix.defaults = {
    offset: 0
  }


 /* AFFIX NO CONFLICT
  * ================= */

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


 /* AFFIX DATA-API
  * ============== */

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
        , data = $spy.data()

      data.offset = data.offset || {}

      data.offsetBottom && (data.offset.bottom = data.offsetBottom)
      data.offsetTop && (data.offset.top = data.offsetTop)

      $spy.affix(data)
    })
  })


}(window.jQuery);
