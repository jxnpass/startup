import React from 'react';
import './about.css';

export function About() {
  return (
    <main>

      <p>
        This website was created by Jackson Passey as a free tool to help users create and manage tournament brackets
        for various sports and competitions. Whether you're organizing a local sports event, a gaming tournament,
        or any other competitive activity, Bracket Builder Free<sup>&reg;</sup> aims to simplify the process of bracket creation
        and management.
      </p>

      <div class="row">
        <div class="col-md-6">
          <div id="picture" class="picture-box"><img width="200px" alt="random"
           src="https://static.vecteezy.com/system/resources/previews/049/563/074/non_2x/icon-of-person-playing-volleyball-symbol-illustration-vector.jpg"/>
          </div>
        </div>
        <div class="col-md-6">
          <div id="quote">
        <div><b>I like volleyball</b></div>
        <div>- Jackson </div>
          </div>
        </div>
      </div>
      
    </main>
  );
}
