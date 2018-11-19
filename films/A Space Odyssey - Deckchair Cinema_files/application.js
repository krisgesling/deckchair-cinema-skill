jQuery(document).ready(function($) {  

    $('.gt-backtotop').click(function(){
        $('html, body').animate({scrollTop:0}, 'slow');
    });

    $(window).load(function () {
      $('.gtan-comma').data('countToOptions', {
        formatter: function (value, options) {
          return value.toFixed(options.decimals).replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
        }
      });

      $('.gtan-load').each(count);
 
        $('.gtan-inview').one("inview", function(event, isInView, visiblePartX, visiblePartY) {
              if (isInView) {
                // element is now visible in the viewport
                $(this).each(count);
            }
        });

      function count(options) {
        var $this = $(this);
        options = $.extend({}, options || {}, $this.data('countToOptions') || {});
        $this.countTo(options);
      }
    });
                   
$(window).scroll(function() {
    $('.gt-animation').each(function(){
    var imagePos = $(this).offset().top;

    var topOfWindow = $(window).scrollTop();
        if (imagePos < topOfWindow+800) {
            $(this).addClass('animated');
            $(this).css('visibility','visible');
        }
    });
});

if($(".gt-btn-anim").length > 0){
    if($(this).find('div.gt-click-animation').length != 0)
    $('.gt-btn-anim').click(function() {
        $(this).find('div').addClass("animated");
        $(this).find('div').bind('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function () {
           $(this).removeClass('animated');
        });
    });
}

if($(".gt-click-animation").length > 0){
    $('.gt-click-animation').click(function() {
        $(this).addClass("animated");
        $(this).bind('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function () {
           $(this).removeClass('animated');
        });
    });
}

$('.gt-btn-anim').mouseenter(function(){
    if($(this).find('div.gt-hover-animation').length != 0)
        if($(this).is('.gt-btn-anim:hover'))
        $(this).find('div').addClass( "animated" );
        $(this).find('div').bind('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function () {
            $(this).removeClass('animated');
        });
});

$('.gt-hover-animation').mouseenter(function(){
  if($(this).is('.gt-hover-animation:hover'))
    $( this ).addClass( "animated" );
    $(this)('div').bind('animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd', function () {
        $(this).removeClass('animated');
    });
});

// Some general UI pack related JS
// Extend JS String with repeat method
String.prototype.repeat = function(num) {
  return new Array(num + 1).join(this);
};

(function($) {

  // Add segments to a slider
  $.fn.addSliderSegments = function (amount) {
    return this.each(function () {
      var segmentGap = 100 / (amount - 1) + "%"
        , segment = "<div class='ui-slider-segment' style='margin-left: " + segmentGap + ";'></div>";
      $(this).prepend(segment.repeat(amount - 2));
    });
  };

  $(function() {

    // Custom Selects
    // $("select[name='huge']").selectpicker({style: 'btn-huge btn-primary', menuStyle: 'dropdown-inverse'});
    // $("select[name='large']").selectpicker({style: 'btn-large btn-danger'});
    // $("select[name='info']").selectpicker({style: 'btn-info'});
    // $("select[name='small']").selectpicker({style: 'btn-small btn-warning'});

    // Disabled Button
    $('body').on('click', 'a.disabled', function(event) {
        event.preventDefault();
    });

    // Tabs
    $(".nav-tabs a").on('click', function (e) {
      e.preventDefault();
      $(this).tab("show");
    })

    // Show and create tooltip first so we can apply the data-tooltip-style
    $("[data-toggle=tooltip]").tooltip("show");

    // Add style class name to a tooltips

        $('.tooltip').addClass(function() {
          if ($(this).prev().attr("data-tooltip-style")) {
            return "tooltip-" + $(this).prev().attr("data-tooltip-style");
          }
        });
    

    // Hide the tooltip so it's not visible until hovering
    $("[data-toggle=tooltip]").tooltip("hide");

    // Popovers
    $("[data-toggle=popover]").popover("hide").on('click', function(e) {e.preventDefault(); return true;});

    // Tags Input
    // $(".tagsinput").tagsInput();

    // jQuery UI Sliders
    // var $slider = $("#slider");
    // if ($slider.length > 0) {
    //   $slider.slider({
    //     min: 1,
    //     max: 5,
    //     value: 3,
    //     orientation: "horizontal",
    //     range: "min"
    //   }).addSliderSegments($slider.slider("option").max);
    // }

    // var $slider2 = $("#slider2");
    // if ($slider2.length > 0) {
    //   $slider2.slider({
    //     min: 1,
    //     max: 5,
    //     values: [3, 4],
    //     orientation: "horizontal",
    //     range: true
    //   }).addSliderSegments($slider2.slider("option").max);
    // }

    // var $slider3 = $("#slider3")
    //   , slider3ValueMultiplier = 100
    //   , slider3Options;

    // if ($slider3.length > 0) {
    //   $slider3.slider({
    //     min: 1,
    //     max: 5,
    //     values: [3, 4],
    //     orientation: "horizontal",
    //     range: true,
    //     slide: function(event, ui) {
    //       $slider3.find(".ui-slider-value:first")
    //         .text("$" + ui.values[0] * slider3ValueMultiplier)
    //         .end()
    //         .find(".ui-slider-value:last")
    //         .text("$" + ui.values[1] * slider3ValueMultiplier);
    //     }
    //   });

    //   slider3Options = $slider3.slider("option");
    //   $slider3.addSliderSegments(slider3Options.max)
    //     .find(".ui-slider-value:first")
    //     .text("$" + slider3Options.values[0] * slider3ValueMultiplier)
    //     .end()
    //     .find(".ui-slider-value:last")
    //     .text("$" + slider3Options.values[1] * slider3ValueMultiplier);
    // }

    // Add style class name to a tooltips
    $(".tooltip").addClass(function() {
      if ($(this).prev().attr("data-tooltip-style")) {
        return "tooltip-" + $(this).prev().attr("data-tooltip-style");
      }
    });

    // Placeholders for input/textarea
    // $("input, textarea").placeholder();

    // Make pagination demo work
    // $(".pagination a").on('click', function() {
    //   $(this).parent().siblings("li").removeClass("active").end().addClass("active");
    // });

    $(".btn-group a").on('click', function() {
      $(this).siblings().removeClass("active").end().addClass("active");
    });

    // Disable link clicks to prevent page scrolling
    $('a[href="#fakelink"]').on('click', function (e) {
      e.preventDefault();
    });

    // jQuery UI Spinner
    // $.widget( "ui.customspinner", $.ui.spinner, {
    //   widgetEventPrefix: $.ui.spinner.prototype.widgetEventPrefix,
    //   _buttonHtml: function() { // Remove arrows on the buttons
    //     return "" +
    //     "<a class='ui-spinner-button ui-spinner-up ui-corner-tr'>" +
    //       "<span class='ui-icon " + this.options.icons.up + "'></span>" +
    //     "</a>" +
    //     "<a class='ui-spinner-button ui-spinner-down ui-corner-br'>" +
    //       "<span class='ui-icon " + this.options.icons.down + "'></span>" +
    //     "</a>";
    //   }
    // });

    // $('#spinner-01').customspinner({
    //   min: -99,
    //   max: 99
    // }).on('focus', function () {
    //   $(this).closest('.ui-spinner').addClass('focus');
    // }).on('blur', function () {
    //   $(this).closest('.ui-spinner').removeClass('focus');
    // });


    // Focus state for append/prepend inputs
    $('.input-prepend, .input-append').on('focus', 'input', function () {
      $(this).closest('.control-group, form').addClass('focus');
    }).on('blur', 'input', function () {
      $(this).closest('.control-group, form').removeClass('focus');
    });

    // Table: Toggle all checkboxes
    $('.table .toggle-all').on('click', function() {
      var ch = $(this).find(':checkbox').prop('checked');
      $(this).closest('.table').find('tbody :checkbox').checkbox(!ch ? 'check' : 'uncheck');
    });

    // Table: Add class row selected
    $('.table tbody :checkbox').on('check uncheck toggle', function (e) {
      var $this = $(this)
        , check = $this.prop('checked')
        , toggle = e.type == 'toggle'
        , checkboxes = $('.table tbody :checkbox')
        , checkAll = checkboxes.length == checkboxes.filter(':checked').length

      $this.closest('tr')[check ? 'addClass' : 'removeClass']('selected-row');
      if (toggle) $this.closest('.table').find('.toggle-all :checkbox').checkbox(checkAll ? 'check' : 'uncheck');
    });

    // jQuery UI Datepicker
    // var datepickerSelector = '#datepicker-01';
    // $(datepickerSelector).datepicker({
    //   showOtherMonths: true,
    //   selectOtherMonths: true,
    //   dateFormat: "d MM, yy",
    //   yearRange: '-1:+1'
    // }).prev('.btn').on('click', function (e) {
    //   e && e.preventDefault();
    //   $(datepickerSelector).focus();
    // });

    // Now let's align datepicker with the prepend button
    // $(datepickerSelector).datepicker('widget').css({'margin-left': -$(datepickerSelector).prev('.btn').outerWidth() - 2});

    // Switch
    // $("[data-toggle='switch']").wrap('<div class="switch" />').parent().bootstrapSwitch();

    // Stackable tables
    // $(".table-striped").stacktable({id: "rwd-table"});

    // make code pretty
    window.prettyPrint && prettyPrint()
  });
})(jQuery);
});