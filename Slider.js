/**
 * @module InputRange/Slider
 */

import React from 'react';
import classNames from 'classnames';

/**
 * Get the owner document of slider
 * @private
 * @param {Slider} slider - React component
 * @return {Document} Document
 */
function getDocument(slider) {
  const { slider: { ownerDocument } } = slider.refs;

  return ownerDocument;
}

/**
 * Get the style of slider based on its props
 * @private
 * @param {Slider} slider - React component
 * @return {Object} CSS styles
 */
function getStyle(slider) {
  const perc = (slider.props.percentage || 0) * 100;
  const style = {
    position: 'absolute',
    left: `${perc}%`,
  };

  return style;
}

/**
 * Slider React component
 * @class
 * @extends React.Component
 * @param {Object} props - React component props
 */
export default class Slider extends React.Component {

  static propTypes = {
    ariaLabelledby: React.PropTypes.string,
    ariaControls: React.PropTypes.string,
    formatLabel: React.PropTypes.func.isRequired,
    maxValue: React.PropTypes.number,
    minValue: React.PropTypes.number,
    onSliderKeyDown: React.PropTypes.func.isRequired,
    percentage: React.PropTypes.number.isRequired,
    type: React.PropTypes.string.isRequired,
    value: React.PropTypes.number.isRequired,
    active: React.PropTypes.bool,
  };

  focus() {
    this.refs.control.focus();
  }

  /**
   * Handle any keydown event received by the component
   * @param {SyntheticEvent} event - User event
   */
  handleKeyDown = (event) => {
    this.props.onSliderKeyDown(event, this);
  };

  /**
   * Render method of the component
   * @return {string} Component JSX
   */
  render() {
    const style = getStyle(this);

    return (
      <span
        className="InputRange-sliderContainer"
        ref="slider"
        style={ style }
      >
        <span className="InputRange-label InputRange-label--value">
          <span className="InputRange-labelContainer">
            {this.props.formatLabel(this.props.value)}
          </span>
        </span>

        <span
          aria-labelledby={ this.props.ariaLabelledby }
          aria-controls={ this.props.ariaControls }
          aria-valuemax={ this.props.maxValue }
          aria-valuemin={ this.props.minValue }
          aria-valuenow={this.props.formatLabel(this.props.value)}
          className={classNames(
            'InputRange-slider',
            this.props.active && 'InputRange-slider--active'
          )}
          draggable="false"
          ref="control"
          onKeyDown={ this.handleKeyDown }
          role="slider"
          tabIndex={0}
        >
        </span>
      </span>
    );
  }
}
