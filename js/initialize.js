$(document).ready(function () {
  $(".dropdown-button").dropdown(); //Initialize Cities Dropdown
  $(".button-collapse").sideNav(); //Intialize slide-out navigation
  $(".model").modal(); // Initialize modal dialog
  $('#zomato').modal({ dismissible: false }); //Modal dialog cannot be dismissed with a click 
  $('.place-items').click(function () {
    $(".button-collapse").sideNav('hide'); //Hide the side navigation when a place is clicked on small and medium devices
  });
});