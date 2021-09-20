
$(document).ready(function(){

    $('.burger').click(function() {
      $('.burger').toggleClass('cross');
      $('.nav-principal').toggleClass('open-menu');
    });


    $('.active_transition a').click(function(e) { 
        $('.transition_circle').removeClass("transition_close"); 
        $('.transition_circle').addClass("transition_open");  
        e.preventDefault();
          var linkUrl = $(this).attr('href');
          setTimeout(function(url) { window.location = url; 
        }, 1500, linkUrl);
     });

     $('.aide').click(function() {
        $('.onglet-aide').toggleClass('open-aide');
        $('.symbole-aide').html('?');

        if($('.onglet-aide').hasClass('open-aide')){
          $('.symbole-aide').html('X');
        }

    });



});