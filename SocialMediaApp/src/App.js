import React, { Component } from 'react';
import './App.css';

import image2base64 from 'image-to-base64';

const SAMPLE_IMAGE_CATEGORIES = [
  {name: 'Travel', id: 431862},
  {name: 'Patterns', id: 175083},
  {name: 'Lifestyle', id: 399562}
];

const IMAGE_FILTERS = [
  {
    name: 'flip',
    fn: (image, canvas, canvasContext) => {
      canvasContext.save();
      canvasContext.translate(canvas.width, 0);
      canvasContext.scale(-1, 1);
      canvasContext.rect(0, 0, canvas.width / 2, canvas.height);
      canvasContext.clip();
      canvasContext.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvasContext.restore();
    }
  },
  {
    name: 'circle-mask',
    fn: (image, canvas, canvasContext) => {
      canvasContext.rect(0, 0, canvas.width, canvas.height);
      canvasContext.fillStyle = '#eee';
      canvasContext.fill();
      canvasContext.beginPath();
      canvasContext.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2.5, 0, 2 * Math.PI);
      canvasContext.fillStyle = '#f00';
      canvasContext.clip();
      canvasContext.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
  },
  {
    name: 'tint',
    fn: (image, canvas, canvasContext) => {
      canvasContext.globalCompositeOperation = 'difference';
      canvasContext.rect(0, 0, canvas.width, canvas.height);
      canvasContext.fillStyle = 'rgba(255, 0, 0, 0.7)';
      canvasContext.fill();
    }
  }
];

class App extends Component {

  state = {
    displayedImage: null,
    sampleImages: [],
    imageFilters: IMAGE_FILTERS,
    offline: true
  }

  constructor() {
    super();

    this.loadSampleImages = this.loadSampleImages.bind(this);
    this.loadImageFromURL = this.loadImageFromURL.bind(this);
    this.handleImageCapture = this.handleImageCapture.bind(this);
    this.renderDisplayedImageOnCanvas = this.renderDisplayedImageOnCanvas.bind(this);
    this.getFlatCanvasImage = this.getFlatCanvasImage.bind(this);
    this.rotateDisplayedImage = this.rotateDisplayedImage.bind(this);
    this.applyFilterFunction = this.applyFilterFunction.bind(this);
  }

  componentDidMount() {

    this.canvas = this.refs.imageCanvas;
    this.canvasContext = this.canvas.getContext('2d');
    this.canvas.width = 1152;
    this.canvas.height = 1152;

    if (navigator.onLine) {
      this.setState({ offline: false });
      this.loadSampleImages();
    }

    window.addEventListener('offline', () => {
      this.setState({ offline: true, sampleImages: [] });
    });

    window.addEventListener('online', () => {
      this.loadSampleImages();
      this.setState({ offline: false });
    });

  }

  loadSampleImages() {
    let sampleImagePromises = SAMPLE_IMAGE_CATEGORIES.map(sampleImageCategory => {
      return this.loadImageFromURL(
        `https://source.unsplash.com/collection/${sampleImageCategory.id}/1000x1000`,
        sampleImageCategory.name
      );
    });
    Promise.all(sampleImagePromises)
      .then(sampleImages => {
        this.setState({ sampleImages })
      })
      .catch(error => {
        alert('An error occurred while loading the images, please try again.')
      });
  }

  loadImageFromURL(url, alt = '') {
    return image2base64(url)
      .then(base64Src => {
        let img = new Image();
        img.src = 'data:image/jpeg;base64, ' + base64Src;
        img.alt = alt;
        return img;
      })
      .catch(error => console.error(error));
  }

  handleImageCapture(e) {

    let reader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      reader.onload = e => {
        let img = new Image();
        img.onload = () => this.renderDisplayedImageOnCanvas(img);
        img.src = e.target.result;
      }
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  renderDisplayedImageOnCanvas(image) {

    let xOffset, yOffset, width, height;
    let aspectRatio = image.width / image.height;

    if (aspectRatio >= 1) {
      height = this.canvas.width;
      width = aspectRatio * this.canvas.width;
      xOffset = (this.canvas.width - width) / 2;
      yOffset = 0;
    } else if (aspectRatio < 1) {
      width = this.canvas.width;
      height = (1 / aspectRatio) * this.canvas.height;
      xOffset = 0;
      yOffset = (this.canvas.height - height) / 2;
    }

    this.canvasContext.drawImage(image, xOffset, yOffset, width, height);
    this.setState({ displayedImage: image });
  }

  getFlatCanvasImage() {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject('Unable to getFlatCanvasImage()');
      image.src = this.canvas.toDataURL("image/png");
    });
  }

  rotateDisplayedImage() {
    let rotationOrientation = 90;
    this.getFlatCanvasImage()
      .then(image => {
        this.canvasContext.save();
        this.canvasContext.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.canvasContext.rotate(rotationOrientation * Math.PI / 180);
        this.canvasContext.drawImage(
          image,
          -this.canvas.width / 2, -this.canvas.height / 2,
          this.canvas.width, this.canvas.height
        );
        this.canvasContext.restore();
      })
  }

  applyFilterFunction(filterFunction) {
    this.getFlatCanvasImage().then(image => {
      filterFunction(image, this.canvas, this.canvasContext);
    });
  }

  render() {
    return (
      <div className="app">
        <h1>My Instagram</h1>
        { this.state.offline ? <Offline /> :
          this.state.sampleImages.length === 0 ? <LoadingBlocks /> :
          <div className="sample-images blocks-container">
          {
            this.state.sampleImages.map(sampleImage => { 
              return <img key={'image-' + sampleImage.alt.toLowerCase()}
                          src={sampleImage.src}
                          alt={sampleImage.alt}
                          onClick={() => this.renderDisplayedImageOnCanvas(sampleImage)} />
            })
          }
          </div>
        }
        <div className="image-on-display">
          <canvas
            ref="imageCanvas"
            className="image-canvas"
            width="576" height="576">
          </canvas>
          <div className="button-container upload">
            <input
              id="file-upload-button"
              type="file"
              accept="image/*"
              onChange={this.handleImageCapture} />
            <label htmlFor="file-upload-button"></label>
          </div>
          {
            this.state.displayedImage &&
            <div className="button-container rotate">
              <input
                id="rotate-button"
                type="button"
                onClick={this.rotateDisplayedImage} />
              <label htmlFor="rotate-button"></label>
            </div>
          }
        </div>
        {
          this.state.canvasImage &&
          <img src={this.state.canvasImage.src} alt={this.state.canvasImage.alt} />
        }
        {
          !this.state.displayedImage &&
          <div className="image-filters blocks-container">
          </div>
        }
        {
          this.state.displayedImage &&
          <div className="image-filters blocks-container">
            { this.state.imageFilters.map(imageFilter => {
                return <input key={`image-filter-${imageFilter.name}`}
                          type="button"
                          className={`image-filter ${imageFilter.name}`}
                          onClick={() => this.applyFilterFunction(imageFilter.fn)}
                          />
            })
            }
          </div>
        }
      </div>
    );
  }

}

const Offline = () => (
  <div className="blocks-container offline">
  </div>
)

const LoadingBlocks = () => (
  <div className="blocks-container">
    <div className="loading-block"></div>
    <div className="loading-block"></div>
    <div className="loading-block"></div>
  </div>
)

export default App;
