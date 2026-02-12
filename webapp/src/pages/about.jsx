import React from 'react';
import '../styles/about.css';

export default function About() {
  return (
    <div className="page page-about">
      <p>
        This website was created by Jackson Passey as a free tool to help users create and manage tournament brackets
        for various sports and competitions. Whether you're organizing a local sports event, a gaming tournament, or any
        other competitive activity, Bracket Builder Free<sup>&reg;</sup> aims to simplify the process of bracket creation
        and management.
      </p>

      <div className="row">
        <div className="col-md-6">
          <div id="picture" className="picture-box">
            <img
              width="200"
              alt="volleyball icon"
              src="https://static.vecteezy.com/system/resources/previews/049/563/074/non_2x/icon-of-person-playing-volleyball-symbol-illustration-vector.jpg"
            />
          </div>
        </div>

        <div className="col-md-6">
          <div id="quote">
            <div>
              <b>I like volleyball</b>
            </div>
            <div>- Jackson</div>
          </div>
        </div>
      </div>
    </div>
  );
}
