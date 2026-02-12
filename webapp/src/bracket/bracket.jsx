import React from 'react';
import './bracket.css';

export function Bracket() {
  return (
    <main class="bracket-page">
    <div class="bracket-wrapper"> 
        <div class="bracket-header">
        <h1 class="bracket-title">*Bracket Name*</h1>
        <p class="bracket-description">
            *Bracket Description* Author Note: this is purely static right now. When applying CSS and JavaScript
            this should be more dynamic.
        </p>
        </div>

        <div class="bracket">

        <section class="round">
            <h2>Round of 16</h2>

            <div class="pair">
            <div class="pair-inner"> 
                <div class="match" id="m1">
                <div class="team" id="t1">Team 1 <input /></div>
                <div class="team" id="t16">Team 16 <input /></div>
                </div>
                <div class="match" id="m2">
                <div class="team" id="t8">Team 8 <input /></div>
                <div class="team" id="t9">Team 9 <input /></div>
                </div>
            </div>
            </div>

            <div class="pair">
            <div class="pair-inner">
                <div class="match" id="m3">
                <div class="team" id="t4">Team 4 <input /></div>
                <div class="team" id="t13">Team 13 <input /></div>
                </div>
                <div class="match" id="m4">
                <div class="team" id="t5">Team 5 <input /></div>
                <div class="team" id="t12">Team 12 <input /></div>
                </div>
            </div>
            </div>

            <div class="pair">
            <div class="pair-inner">
                <div class="match" id="m5">
                <div class="team" id="t2">Team 2 <input /></div>
                <div class="team" id="t15">Team 15 <input /></div>
                </div>
                <div class="match" id="m6">
                <div class="team" id="t7">Team 7 <input /></div>
                <div class="team" id="t10">Team 10 <input /></div>
                </div>
            </div>
            </div>

            <div class="pair">
            <div class="pair-inner">
                <div class="match" id="m7">
                <div class="team" id="t3">Team 3 <input /></div>
                <div class="team" id="t14">Team 14 <input /></div>
                </div>
                <div class="match" id="m8">
                <div class="team" id="t6">Team 6 <input /></div>
                <div class="team" id="t11">Team 11 <input /></div>
                </div>
            </div>
            </div>


        </section>

        <section class="round">
            <h2>Round of 8</h2>

            <div class="pair">
            <div class="pair-inner"> 
                <div class="match" id="m9">
                <div class="team" id="w1">Winner 1 <input /></div>
                <div class="team" id="w2">Winner 2 <input /></div>
                </div>
            </div>
            </div>

            <div class="pair">
            <div class="pair-inner">
                <div class="match" id="m10">
                <div class="team" id="w3">Winner 3 <input /></div>
                <div class="team" id="w4">Winner 4 <input /></div>
                </div>
            </div>
            </div>

            <div class="pair">
            <div class="pair-inner">
                <div class="match" id="m11">
                <div class="team" id="w5">Winner 5 <input /></div>
                <div class="team" id="w6">Winner 6 <input /></div>
                </div>
            </div>
            </div>

            <div class="pair">
            <div class="pair-inner" >
                <div class="match" id="m12">
                <div class="team" id="w7">Winner 7 <input /></div>
                <div class="team" id="w8">Winner 8 <input /></div>
                </div>
            </div>
            </div>
            
        </section>

        <section class="round">
            <h2>Semifinals</h2>

            <div class="pair">
            <div class="pair-inner">
                <div class="match" id="m13">
                <div class="team" id="w9">Winner A <input /></div>
                <div class="team" id="w10">Winner B <input /></div>
                </div>
            </div>
            </div>

            <div class="pair">
            <div class="pair-inner">
                <div class="match" id="m14">
                <div class="team" id="w11">Winner C <input /></div>
                <div class="team" id="w12">Winner D <input /></div>
                </div>
            </div>
            </div>
        </section>


        <section class="round">
            <h2>Final</h2>

            <div class="pair">
            <div class="pair-inner">
                <div class="match" id="m15">
                <div class="team" id="w13">Winner 1 <input /></div>
                <div class="team" id="w14">Winner 2 <input /></div>
                </div>
            </div>
            </div>
        </section>

        <section class="round">
            <h2>Champion</h2>

            <div class="match champion" id = 'm16'>
            <div class="team">Champion <input /></div>
            </div>
        </section>
        </div>
        <svg id="bracket-lines"></svg>
    </div>
    </main>
  );
}
