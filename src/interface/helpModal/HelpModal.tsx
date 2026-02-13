/*
 * Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 * GNU Affero General Public License v3.0
 */

import useGame from '../../stores/store';
import './style.css';

const HelpModal = () => {
  // ИСПРАВЛЕНО: Добавлено : any для state
  const { setModal, showBars, toggleBars } = useGame((state: any) => state);

  return (
    <div className="modal" onClick={() => setModal(false)}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-main">
          <div className="modal-text">
            Click on the SPIN button or press SPACE to spin.
          </div>
          <div className="modal-text">
            Cherry Charm only considers it a match if the fruits appear
            consecutively from left to right
          </div>
          <div className="modal-text">Click and drag to rotate the 3D view</div>
          
          <div id="paytable">
            <div className="modal-text">
              <img className="modal-image" src="./images/cherry.png" alt="cherry" />
              <img className="modal-image" src="./images/cherry.png" alt="cherry" />
              <img className="modal-image" src="./images/cherry.png" alt="cherry" />
              <span> Pay 50 </span>
              <img className="modal-image" src="./images/coin.png" alt="coin" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/apple.png" alt="apple" />
              <img className="modal-image" src="./images/apple.png" alt="apple" />
              <img className="modal-image" src="./images/apple.png" alt="apple" />
              <span> Pay 20 </span>
              <img className="modal-image" src="./images/coin.png" alt="coin" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/banana.png" alt="banana" />
              <img className="modal-image" src="./images/banana.png" alt="banana" />
              <img className="modal-image" src="./images/banana.png" alt="banana" />
              <span> Pay 15 </span>
              <img className="modal-image" src="./images/coin.png" alt="coin" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/lemon.png" alt="lemon" />
              <img className="modal-image" src="./images/lemon.png" alt="lemon" />
              <img className="modal-image" src="./images/lemon.png" alt="lemon" />
              <span> Pay 5 </span>
              <img className="modal-image" src="./images/coin.png" alt="coin" />
            </div>
          </div>

          <button onClick={toggleBars}>
            {showBars ? 'Hide' : 'Show'} Bars
          </button>

          <div style={{ marginTop: '20px' }}>
            <div>
              <a
                className="modal-link"
                href="https://michaelkolesidis.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                © Michael Kolesidis
              </a>
            </div>

            <div id="source">
              <div>
                <a
                  className="modal-source modal-link"
                  href="https://www.gnu.org/licenses/agpl-3.0.en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Licensed under GNU AGPL 3.0 •
                </a>
              </div>
              <div>
                <a
                  className="modal-source modal-link"
                  href="https://github.com/michaelkolesidis/cherry-charm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
