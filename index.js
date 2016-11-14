/**
 * @module InputRange
 */

import React from 'react';
import classNames from 'classnames';
import Slider from './Slider';
import valueTransformer from './valueTransformer';
import { captialize, distanceTo, isDefined, isObject, length } from './util';
import { maxMinValuePropType } from './propTypes';

/**
 * A map for storing internal members
 * @const {WeakMap}
 */
const internals = new WeakMap();

/**
 * An object storing keyboard key codes
 * @const {Object.<string, number>}
 */
const KeyCode = {
  DOWN_ARROW: 40,
  LEFT_ARROW: 37,
  RIGHT_ARROW: 39,
  UP_ARROW: 38,
};

/**
 * Check if values are within the max and min range of inputRange
 * @private
 * @param {InputRange} inputRange - React component
 * @param {Range} values - Min/max value of sliders
 * @return {boolean} True if within range
 */
function isWithinRange(inputRange, values) {
  const { props } = inputRange;

  if (inputRange.isMultiValue) {
    return values.min >= props.minValue &&
           values.max <= props.maxValue &&
           values.min < values.max;
  }

  return values.max >= props.minValue &&
         values.max <= props.maxValue;
}

/**
 * Check if the difference between values and the current values of inputRange
 * is greater or equal to its step amount
 * @private
 * @param {InputRange} inputRange - React component
 * @param {Range} values - Min/max value of sliders
 * @return {boolean} True if difference is greater or equal to step amount
 */
function hasStepDifference(inputRange, values) {
  const { props } = inputRange;
  const currentValues = valueTransformer.valuesFromProps(inputRange);

  return length(values.min, currentValues.min) >= props.step ||
         length(values.max, currentValues.max) >= props.step;
}

/**
 * Check if inputRange should update with new values
 * @private
 * @param {InputRange} inputRange - React component
 * @param {Range} values - Min/max value of sliders
 * @return {boolean} True if inputRange should update
 */
function shouldUpdate(inputRange, values) {
  return isWithinRange(inputRange, values) &&
         hasStepDifference(inputRange, values);
}

/**
 * Get all slider keys of inputRange
 * @private
 * @param {InputRange} inputRange - React component
 * @return {Array.<string>} Key names
 */
function getKeys(inputRange) {
  if (inputRange.isMultiValue) {
    return ['min', 'max'];
  }

  return ['max'];
}


/**
 * Get an array of slider HTML for rendering
 * @private
 * @param {InputRange} inputRange - React component
 * @return {Array.<string>} Array of HTML
 */
function renderSliders(inputRange) {
  const sliders = [];
  const keys = getKeys(inputRange);
  const values = valueTransformer.valuesFromProps(inputRange);
  const percentages = valueTransformer.percentagesFromValues(inputRange, values);

  for (const key of keys) {
    const value = values[key];
    const percentage = percentages[key];
    const ref = `slider${captialize(key)}`;

    let { maxValue, minValue } = inputRange.props;

    if (key === 'min') {
      maxValue = values.max;
    } else {
      minValue = values.min;
    }

    const slider = (
      <Slider
        ariaLabelledby={ inputRange.props.ariaLabelledby }
        ariaControls={ inputRange.props.ariaControls }
        formatLabel={ inputRange.formatLabel }
        key={ key }
        maxValue={ maxValue }
        minValue={ minValue }
        onSliderKeyDown={ inputRange.handleSliderKeyDown }
        onSliderKeyUp={ inputRange.handleSliderKeyUp }
        percentage={ percentage }
        ref={ ref }
        type={ key }
        value={ value }
        active={key === inputRange.state.activeKey}
      />
    );

    sliders.push(slider);
  }

  return sliders;
}

/**
 * Get an array of hidden input HTML for rendering
 * @private
 * @param {InputRange} inputRange - React component
 * @return {Array.<string>} Array of HTML
 */
function renderHiddenInputs(inputRange) {
  const inputs = [];
  const keys = getKeys(inputRange);

  for (const key of keys) {
    const name = inputRange.isMultiValue ? `${inputRange.props.name}${captialize(key)}` : inputRange.props.name;

    const input = (
      <input type="hidden" name={ name }/>
    );
  }

  return inputs;
}

/**
 * InputRange React component
 * @class
 * @extends React.Component
 * @param {Object} props - React component props
 */
export default class InputRange extends React.Component {

  static propTypes = {
    ariaLabelledby: React.PropTypes.string,
    ariaControls: React.PropTypes.string,
    defaultValue: maxMinValuePropType,
    disabled: React.PropTypes.bool,
    formatLabel: React.PropTypes.func,
    labelPrefix: React.PropTypes.string,
    labelSuffix: React.PropTypes.string,
    maxValue: maxMinValuePropType,
    minValue: maxMinValuePropType,
    name: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
    onChangeComplete: React.PropTypes.func,
    step: React.PropTypes.number,
    value: maxMinValuePropType,
    plusInfinity: React.PropTypes.bool,
    minusInfinity: React.PropTypes.bool,
  };

  static defaultProps = {
    defaultValue: 0,
    disabled: false,
    labelPrefix: '',
    labelSuffix: '',
    maxValue: 10,
    minValue: 0,
    step: 1,
    value: null,
    formatLabel: label => label,
  };

  state = {
    activeKey: undefined
  };

  constructor(props) {
    super(props);

    // Private
    internals.set(this, {});
  }

  /**
   * Return the clientRect of the component's track
   * @member {ClientRect}
   */
  get trackClientRect() {
    const { track } = this.refs;

    if (track) {
      return track.getBoundingClientRect();
    }

    return {
      height: 0,
      left: 0,
      top: 0,
      width: 0,
    };
  }

  /**
   * Return true if the component accepts a range of values
   * @member {boolean}
   */
  get isMultiValue() {
    return isObject(this.props.value) ||
           isObject(this.props.defaultValue);
  }

  /**
   * Get the key name of a slider that's the closest to a event clientX
   * @private
   * @param {InputRange} inputRange - React component
   * @param {Point} position - x/y
   * @return {string} Key name
   */
  getKeyFromEvent(event) {
    const { clientX } = event.touches ? event.touches[0] : event;
    var position = {
      x: clientX - this.trackClientRect.left,
      y: 0
    };
    const values = valueTransformer.valuesFromProps(this);
    const positions = valueTransformer.positionsFromValues(this, values);

    if (this.isMultiValue) {
      const distanceToMin = distanceTo(position, positions.min);
      const distanceToMax = distanceTo(position, positions.max);

      if (distanceToMin < distanceToMax) {
        return 'min';
      }
    }

    return 'max';
  }

  getKeyFromSlider(slider) {
    if (slider === this.refs.sliderMin) {
      return 'min';
    }

    return 'max';
  }

  /**
   * Update the position of a slider by key
   * @param {string} key - min/max
   * @param {Point} position x/y
   */
  updatePosition(key, position) {
    const values = valueTransformer.valuesFromProps(this);
    const positions = valueTransformer.positionsFromValues(this, values);

    positions[key] = position;

    this.updatePositions(positions);
  }

  /**
   * Update the position of sliders
   * @param {Object} positions
   * @param {Point} positions.min
   * @param {Point} positions.max
   */
  updatePositions(positions) {
    const values = {
      min: valueTransformer.valueFromPosition(this, positions.min),
      max: valueTransformer.valueFromPosition(this, positions.max),
    };

    const transformedValues = {
      min: valueTransformer.stepValueFromValue(this, values.min),
      max: valueTransformer.stepValueFromValue(this, values.max),
    };

    this.updateValues(transformedValues);
  }

  /**
   * Update the value of a slider by key
   * @param {string} key - max/min
   * @param {number} value - New value
   */
  updateValue(key, value) {
    const values = valueTransformer.valuesFromProps(this);

    values[key] = value;

    this.updateValues(values);
  }

  /**
   * Update the values of all sliders
   * @param {Object|number} values - Object if multi-value, number if single-value
   */
  updateValues(values) {
    if (!shouldUpdate(this, values)) {
      return;
    }

    if (this.isMultiValue) {
      this.props.onChange(values);
    } else {
      this.props.onChange(values.max);
    }
  }

  /**
   * Increment the value of a slider by key name
   * @param {string} key - max/min
   */
  incrementValue(key) {
    const values = valueTransformer.valuesFromProps(this);
    const value = values[key] + this.props.step;

    this.updateValue(key, value);
  }

  /**
   * Decrement the value of a slider by key name
   * @param {string} key - max/min
   */
  decrementValue(key) {
    const values = valueTransformer.valuesFromProps(this);
    const value = values[key] - this.props.step;

    this.updateValue(key, value);
  }

  /**
   * Format label
   * @param {number} labelValue - Label value
   * @return {string} Formatted label value
   */
  formatLabel = (labelValue) => {
    const { formatLabel, labelPrefix, labelSuffix } = this.props;

    if (formatLabel) {
      return formatLabel(labelValue, { labelPrefix, labelSuffix });
    }

    return `${labelPrefix}${labelValue}${labelSuffix}`;
  };

  /**
   * Handle any keydown event received by the slider
   * @param {SyntheticEvent} event - User event
   * @param {Slider} slider - React component
   */
  handleSliderKeyDown = (event, slider) => {
    this.handleInteractionStart();
    if (this.props.disabled) {
      return;
    }

    const key = this.getKeyFromSlider(slider);

    switch (event.keyCode) {
    case KeyCode.LEFT_ARROW:
    case KeyCode.DOWN_ARROW:
      event.preventDefault();
      this.decrementValue(key);
      break;

    case KeyCode.RIGHT_ARROW:
    case KeyCode.UP_ARROW:
      event.preventDefault();
      this.incrementValue(key);
      break;

    default:
      break;
    }
  };

  handleSliderKeyUp = (event, slider) => {
    this.handleInteractionEnd();
  };


  /**
   * Handle the start of any user-triggered event
   * @param {SyntheticEvent} event - User event
   */
  handleInteractionStart = () => {
    const _this = internals.get(this);

    if (!this.props.onChangeComplete || isDefined(_this.startValue)) {
      return;
    }

    _this.startValue = this.props.value || this.props.defaultValue;
  };

  /**
   * Handle the end of any user-triggered event
   * @param {SyntheticEvent} event - User event
   */
  handleInteractionEnd = () => {
    const _this = internals.get(this);

    if (!this.props.onChangeComplete || !isDefined(_this.startValue)) {
      return;
    }

    if (_this.startValue !== this.props.value) {
      this.props.onChangeComplete(this, this.props.value);
    }

    _this.startValue = null;
  };

  /**
   * Handle any click event received by the component
   * @param {SyntheticEvent} event - User event
   */
  handleClick = (event) => {
    event.preventDefault();
  };

  /**
   * Handle any mousedown event received by the component
   * @param {SyntheticEvent} event - User event
   */
  handleMouseDown = (event) => {
    this.handleInteractionStart();
    event.preventDefault();
    const activeKey = this.getKeyFromEvent(event);
    this.setState({ activeKey });
    const position = valueTransformer.positionFromEvent(this, event);
    this.updatePosition(activeKey, position);
    this.refs[`slider${captialize(activeKey)}`].focus();
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  };

  /**
   * Handle any mouseup event received by the component
   * @param {SyntheticEvent} event - User event
   */
  handleMouseUp = () => {
    this.setState({ activeKey: undefined });
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    this.handleInteractionEnd();
  };

  /**
   * Handle any mousemove event received by the component
   * @param {SyntheticEvent} event - User event
   */
  handleMouseMove = (event) => {
    if (this.props.disabled) {
      return;
    }
    if (!this.state.activeKey) {
      return;
    }
    event.preventDefault();
    const position = valueTransformer.positionFromEvent(this, event);
    this.updatePosition(this.state.activeKey, position);
  };

  /**
   * Handle any touchstart event received by the component
   * @param {SyntheticEvent} event - User event
   */
  handleTouchStart = (event) => {
    this.handleInteractionStart();
    event.preventDefault();
    document.addEventListener('touchmove', this.handleTouchMove);
    document.addEventListener('touchend', this.handleTouchEnd);
  };

  /**
   * Handle any touchmove event received by the component
   * @param {SyntheticEvent} event - User event
   */
  handleTouchMove = (event) => {
    this.handleMouseMove(event);
  };

  /**
   * Handle any touchend event received by the component
   * @param {SyntheticEvent} event - User event
   */
  handleTouchEnd = (event) => {
    event.preventDefault();
    this.setState({ activeKey: undefined });
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    this.handleInteractionEnd();
  };


  /**
   * Render method of the component
   * @return {string} Component JSX
   */
  render() {
    const values = valueTransformer.valuesFromProps(this);
    const percentages = valueTransformer.percentagesFromValues(this, values);

    const width = `${(percentages.max - percentages.min) * 100}%`;
    const left = `${percentages.min * 100}%`;

    return (
      <div
        aria-disabled={ this.props.disabled }
        ref="inputRange"
        className={classNames('InputRange', this.props.disabled && 'is-disabled')}

        onMouseDown={ this.handleMouseDown }
        onTouchStart={ this.handleTouchStart }
      >
        <span className="InputRange-label InputRange-label--min">
          <span className="InputRange-labelContainer">
            {this.props.formatLabel ? this.props.formatLabel(this.props.minValue) : this.props.minValue}
          </span>
        </span>

        <div
          className="InputRange-track InputRange-track--container"
          ref="track"
        >
          <div
            style={{ width, left }}
            className="InputRange-track InputRange-track--active"
          >
          </div>
          {renderSliders(this)}
        </div>

        <span className="InputRange-label InputRange-label--max">
          <span className="InputRange-labelContainer">
            {this.props.formatLabel(this.props.maxValue)}
          </span>
        </span>

        { renderHiddenInputs(this) }
      </div>
    );
  }
}
