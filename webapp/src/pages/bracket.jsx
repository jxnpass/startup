import React, { useEffect } from "react";
import "../styles/bracket.css";
import { drawAllConnections } from "../utils/bracketLines.js";

export default function Bracket() {
  useEffect(() => {
    const run = () => requestAnimationFrame(() => drawAllConnections());
    run();
    window.addEventListener("resize", run);
    return () => window.removeEventListener("resize", run);
  }, []);

  return (
    <div className="page page-bracket">
      <div className="bracket-header">
        <h1 className="bracket-title">*Bracket Name*</h1>
        <p className="bracket-description">
          *Bracket Description* Author Note: this is purely static right now. When applying CSS and JavaScript this should
          be more dynamic.
        </p>
      </div>

      <div className="bracket-page">
        <div className="bracket-wrapper">
          <div className="bracket">
            {/* Round of 16 */}
            <section className="round round-16">
              <h2>Round of 16</h2>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m1">
                    <div className="team" id="t1">
                      Team 1 <input />
                    </div>
                    <div className="team" id="t16">
                      Team 16 <input />
                    </div>
                  </div>
                  <div className="match" id="m2">
                    <div className="team" id="t8">
                      Team 8 <input />
                    </div>
                    <div className="team" id="t9">
                      Team 9 <input />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m3">
                    <div className="team" id="t4">
                      Team 4 <input />
                    </div>
                    <div className="team" id="t13">
                      Team 13 <input />
                    </div>
                  </div>
                  <div className="match" id="m4">
                    <div className="team" id="t5">
                      Team 5 <input />
                    </div>
                    <div className="team" id="t12">
                      Team 12 <input />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m5">
                    <div className="team" id="t2">
                      Team 2 <input />
                    </div>
                    <div className="team" id="t15">
                      Team 15 <input />
                    </div>
                  </div>
                  <div className="match" id="m6">
                    <div className="team" id="t7">
                      Team 7 <input />
                    </div>
                    <div className="team" id="t10">
                      Team 10 <input />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m7">
                    <div className="team" id="t3">
                      Team 3 <input />
                    </div>
                    <div className="team" id="t14">
                      Team 14 <input />
                    </div>
                  </div>
                  <div className="match" id="m8">
                    <div className="team" id="t6">
                      Team 6 <input />
                    </div>
                    <div className="team" id="t11">
                      Team 11 <input />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Round of 8 */}
            <section className="round round-8">
              <h2>Round of 8</h2>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m9">
                    <div className="team" id="w1">
                      Winner 1 <input />
                    </div>
                    <div className="team" id="w2">
                      Winner 2 <input />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m10">
                    <div className="team" id="w3">
                      Winner 3 <input />
                    </div>
                    <div className="team" id="w4">
                      Winner 4 <input />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m11">
                    <div className="team" id="w5">
                      Winner 5 <input />
                    </div>
                    <div className="team" id="w6">
                      Winner 6 <input />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m12">
                    <div className="team" id="w7">
                      Winner 7 <input />
                    </div>
                    <div className="team" id="w8">
                      Winner 8 <input />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Semifinals */}
            <section className="round round-4">
              <h2>Semifinals</h2>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m13">
                    <div className="team" id="w9">
                      Winner A <input />
                    </div>
                    <div className="team" id="w10">
                      Winner B <input />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m14">
                    <div className="team" id="w11">
                      Winner C <input />
                    </div>
                    <div className="team" id="w12">
                      Winner D <input />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Final */}
            <section className="round round-2">
              <h2>Final</h2>

              <div className="pair">
                <div className="pair-inner">
                  <div className="match" id="m15">
                    <div className="team" id="w13">
                      Winner 1 <input />
                    </div>
                    <div className="team" id="w14">
                      Winner 2 <input />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Champion */}
            <section className="round round-1">
              <h2>Champion</h2>

              <div className="match champion" id="m16">
                <div className="team">
                  Champion <input />
                </div>
              </div>
            </section>
          </div>

          <svg id="bracket-lines" />
        </div>
      </div>
    </div>
  );
}
