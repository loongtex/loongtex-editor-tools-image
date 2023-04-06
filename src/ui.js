import { IconPicture } from '@codexteam/icons';
import { make } from './utils/dom';

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Ui {
  /**
   * @param {object} ui - image tool Ui module
   * @param {object} ui.api - Editor.js API
   * @param {ImageConfig} ui.config - user config
   * @param {Function} ui.onSelectFile - callback for clicks on Select file button
   * @param {boolean} ui.readOnly - read-only mode flag
   */
  constructor({ api, config, onSelectFile, readOnly }) {
    console.log(api, config);
    this.api = api;
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.readOnly = readOnly;
    this.nodes = {
      wrapper: make('div', [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make('div', [this.CSS.imageContainer]),
      fileButton: this.createFileButton(),
      imageEl: undefined,
      imagePreloader: make('div', this.CSS.imagePreloader),
      caption: make('div', [this.CSS.input, this.CSS.caption], {
        contentEditable: !this.readOnly,
      }),
      leftBtn: make('span', [this.CSS.leftBtn]),
      rightBtn: make('span', [this.CSS.rightBtn]),
    };

    /**
     * Create base structure
     *  <wrapper>
     *    <image-container>
     *      <image-preloader />
     *    </image-container>
     *    <caption />
     *    <select-file-button />
     *  </wrapper>
     */
    this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;
    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);

    this.dragStart = {
      x: 0,
      y: 0,
      isDragging: false,
      direction: '',
    };

    this.imgSize = {
      width: 0,
      height: 0,
      ratio: 0,
    };
    // this.nodes.wrapper.appendChild(this.nodes.caption);
    // this.nodes.wrapper.appendChild(this.nodes.fileButton);
  }

  /**
   * CSS classes
   *
   * @returns {object}
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: 'image-tool',
      imageContainer: 'image-tool__image',
      imagePreloader: 'image-tool__image-preloader',
      imageWrapper: 'image-tool__image-wrapper',
      imageEl: 'image-tool__image-picture',
      leftBtn: 'image-tool__image-leftbtn',
      rightBtn: 'image-tool__image-rightbtn',
      caption: 'image-tool__caption',
    };
  };

  /**
   * Ui statuses:
   * - empty
   * - uploading
   * - filled
   *
   * @returns {{EMPTY: string, UPLOADING: string, FILLED: string}}
   */
  static get status() {
    return {
      EMPTY: 'empty',
      UPLOADING: 'loading',
      FILLED: 'filled',
    };
  }

  /**
   * Renders tool UI
   *
   * @param {ImageToolData} toolData - saved tool data
   * @returns {Element}
   */
  render(toolData) {
    if (!toolData.file || Object.keys(toolData.file).length === 0) {
      this.toggleStatus(Ui.status.EMPTY);
    } else {
      this.toggleStatus(Ui.status.UPLOADING);
    }

    return this.nodes.wrapper;
  }

  /**
   * Creates upload-file button
   *
   * @returns {Element}
   */
  createFileButton() {
    const button = make('div', [this.CSS.button]);

    button.innerHTML = this.config.buttonContent || `${IconPicture} ${this.api.i18n.t('Select an Image')}`;

    button.addEventListener('click', () => {
      this.onSelectFile();
    });

    return button;
  }

  /**
   * Shows uploading preloader
   *
   * @param {string} src - preview source
   * @returns {void}
   */
  showPreloader(src) {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;

    this.toggleStatus(Ui.status.UPLOADING);
  }

  /**
   * Hide uploading preloader
   *
   * @returns {void}
   */
  hidePreloader() {
    this.nodes.imagePreloader.style.backgroundImage = '';
    this.toggleStatus(Ui.status.EMPTY);
  }

  /**
   * Shows an image
   *
   * @param {string} url - image source
   * @returns {void}
   */
  fillImage(url) {
    /**
     * Check for a source extension to compose element correctly: video tag for mp4, img — for others
     */
    const tag = /\.mp4$/.test(url) ? 'VIDEO' : 'IMG';

    const attributes = {
      src: url,
    };

    /**
     * We use eventName variable because IMG and VIDEO tags have different event to be called on source load
     * - IMG: load
     * - VIDEO: loadeddata
     *
     * @type {string}
     */
    let eventName = 'load';

    /**
     * Update attributes and eventName if source is a mp4 video
     */
    if (tag === 'VIDEO') {
      /**
       * Add attributes for playing muted mp4 as a gif
       *
       * @type {boolean}
       */
      attributes.autoplay = true;
      attributes.loop = true;
      attributes.muted = true;
      attributes.playsinline = true;

      /**
       * Change event to be listened
       *
       * @type {string}
       */
      eventName = 'loadeddata';
    }

    /**
     * Compose tag with defined attributes
     *
     * @type {Element}
     */
    this.nodes.imageEl = make(tag, this.CSS.imageEl, attributes);

    console.log(this.config.width, this.config.height);

    this.nodes.imageEl.style.width = this.config.width;
    this.nodes.imageEl.style.height = this.config.height;

    this.nodes.imageWrapper = make('span', this.CSS.imageWrapper);

    if (this.config.direction) {
      this.changeDirection(this.config.direction);
    }

    /**
     * Add load event listener
     */
    this.nodes.imageEl.addEventListener(eventName, () => {
      this.toggleStatus(Ui.status.FILLED);

      /**
       * Preloader does not exists on first rendering with presaved data
       */
      if (this.nodes.imagePreloader) {
        this.nodes.imagePreloader.style.backgroundImage = '';
      }
    });
    const direction = this.config.direction;

    this.nodes.imageWrapper.addEventListener('mouseenter', (event) => {
      if (direction === 'center') {
        this.nodes.imageWrapper.appendChild(this.nodes.leftBtn);
        this.nodes.imageWrapper.appendChild(this.nodes.rightBtn);
      };

      if (direction === 'flex-start') {
        this.nodes.imageWrapper.appendChild(this.nodes.rightBtn);
      };

      if (direction === 'flex-end') {
        this.nodes.imageWrapper.appendChild(this.nodes.leftBtn);
      };

      event.target.style.backgroundColor = '#f5f5f5';
    });

    this.nodes.imageWrapper.addEventListener('mouseleave', (event) => {
      this.dragStart.direction === '' && this.nodes.imageWrapper.contains(this.nodes.leftBtn) && this.nodes.imageWrapper.removeChild(this.nodes.leftBtn);
      this.dragStart.direction === '' && this.nodes.imageWrapper.contains(this.nodes.rightBtn) && this.nodes.imageWrapper.removeChild(this.nodes.rightBtn);
      if (this.dragStart.direction === '') {
        this.nodes.imageWrapper.style.backgroundColor = 'unset';
      }
    });

    this.nodes.leftBtn.addEventListener('mousedown', (event) => {
      this.dragStart.direction = 'left';
      this.btnMouseDown(event);
    });

    this.nodes.rightBtn.addEventListener('mousedown', (event) => {
      this.dragStart.direction = 'right';
      this.btnMouseDown(event);
    });

    document.addEventListener('mousemove', (event) => {
      this.move(event);
    });

    document.addEventListener('mouseup', (event) => {
      this.dragStart.isDragging = false;
      this.dragStart.direction = '';
    });

    this.nodes.imageWrapper.appendChild(this.nodes.imageEl);

    this.nodes.imageContainer.appendChild(this.nodes.imageWrapper);

  }

  /**
   * Shows caption input
   *
   * @param {string} text - caption text
   * @returns {void}
   */
  fillCaption(text) {
    if (this.nodes.caption) {
      this.nodes.caption.innerHTML = text;
    }
  }

  /**
   * Changes UI status
   *
   * @param {string} status - see {@link Ui.status} constants
   * @returns {void}
   */
  toggleStatus(status) {
    for (const statusType in Ui.status) {
      if (Object.prototype.hasOwnProperty.call(Ui.status, statusType)) {
        this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${Ui.status[statusType]}`, status === Ui.status[statusType]);
      }
    }
  }

  /**
   * Apply visual representation of activated tune
   *
   * @param {string} tuneName - one of available tunes {@link Tunes.tunes}
   * @param {boolean} status - true for enable, false for disable
   * @returns {void}
   */
  applyTune(tuneName, status) {
    this.nodes.wrapper.classList.toggle(`${this.CSS.wrapper}--${tuneName}`, status);
  }

  /**
   * 
   * @param {*} value 
   */
  changeDirection(value) {
    this.nodes.imageWrapper.style.alignSelf = value;
  }

  /**
   *
   * @param {*} event
   */
  btnMouseDown(event) {
    this.dragStart.isDragging = true;
    this.dragStart.x = event.clientX;
    this.dragStart.y = event.clientY;

    if (!this.imgSize.width) {
      this.imgSize.width = this.nodes.imageEl.offsetWidth;
    }

    if (!this.imgSize.height) {
      this.imgSize.height = this.nodes.imageEl.offsetHeight;
    }

    this.imgSize.ratio = this.imgSize.width / this.imgSize.height;
  }

  /**
   *
   * @param {*} event
   */
  move(event) {
    if (this.dragStart.isDragging) {
      let dx;

      if (this.dragStart.direction === 'left') {
        dx = this.dragStart.x - event.clientX;
      }

      if (this.dragStart.direction === 'right') {
        dx = event.clientX - this.dragStart.x;
      }

      console.log(dx)

      const newWidth = this.imgSize.width + dx;

      // 计算出比例

      if (this.config.minWidth <= newWidth) {

        const newHeight = newWidth / this.imgSize.ratio;

        this.nodes.imageEl.style.width = newWidth + 'px';
        this.nodes.imageEl.style.height = newHeight + 'px';

        this.imgSize.width = newWidth;
        this.imgSize.height = newHeight;
      }

      this.dragStart.x = event.clientX;
      this.dragStart.y = event.clientY;
    }
  }
}

