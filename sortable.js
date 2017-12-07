import React from 'react';
import {
	View
	, StyleSheet
} from 'react-native';

import PropTypes from 'prop-types';

const ZERO_MARGIN = StyleSheet.create({zero: {
	margin: 0,
	marginTop: 0, 
	marginLeft: 0,
	marginRight: 0,
	marginBottom: 0,
	marginVertical: 0,
	marginHorizontal: 0
}}).zero;

export default class Sortable extends React.Component {

	static propTypes = {
		onChangeChildIndex: PropTypes.func
	}

	_sortableItemLayout = {};
	_grantItem = undefined;

	constructor(props) {
		super(props);

		this.state = {
			children: this._cloneChildren(props),
			shadowChild: undefined
		}
	}

	componentWillReceiveProps(nextProps) {
		_sortableItemLayout = {};
		_grantItem = undefined;
		this.setState({
			children: this._cloneChildren(nextProps)
		});
	}

	render() {
		
		return (
			<View {...this.props}>
				{this.state.children}
				{!this.state.shadowChild ? undefined : React.cloneElement(this.state.shadowChild, {
					style: [this.state.shadowChild.props.style, ZERO_MARGIN, {
						position: 'absolute'
						, ...this.state.shadowLayout
					}]
				})}
			</View>
		);
	}

	_onSortableItemLayout = (item, {nativeEvent: {target, layout}})=> {
		this._sortableItemLayout[item.props._index] = layout;
	}

	/**
	 * 克隆 item 对应的 child, 用于跟随 touch 移动
	 */
	_onGrantSortableItem = (item, {nativeEvent: {pageX, pageY}})=> {
		this._grandItem = item;
		const shadowChild = this.state.children.filter(child=> child.props._index === item.props._index).pop();

		if (shadowChild) {
			const originalLayout = this._sortableItemLayout[item.props._index];

			this.setState({
				shadowChild: React.cloneElement(shadowChild, {
					key: 'SHADOW_CHILD',
					_index: -1,
					pointerEvents: 'none'
				}),
				shadowLayout: {
					left: originalLayout.x,
					top: originalLayout.y,
					width: originalLayout.width,
					height: originalLayout.height
				},
				shadowLocation: {
					left: originalLayout.x,
					top: originalLayout.y,
					width: originalLayout.width,
					height: originalLayout.height,
					pageX, pageY
				}
			})
		}
	}

	_onGrantItemMove = (item, evt)=> {
		const {left, top, width, height} = this._getShadowItemLayout(item, evt);

		this.setState({
			shadowLayout: {
				left, top, width, height
			}
		});
	}

	/**
	 *	
	 */
	_onGrantItemRelease = (item, evt)=> {

		// 如果 onChangeChildIndex 回调不存在，则不会重新排序

		const {left, top, width, height} = this._getShadowItemLayout(item, evt);
		const centerX = left + width/2;
		const centerY = top + height/2;
		
		// step 1. 新建 children 数组
		// step 2. 移除 item 对应的 child 
		// step 3. 找到 shadowItem 当前位置对应的 child -> as locatedChild
		// step 4. 插入到 locatedChild 前面

		// 获取 oldIndex, newIndex;
		var oldIndex, newIndex;
		
		this.state.children.forEach((child, index)=> {
			if (child.props._index === item.props._index) {
				oldIndex = index;
			}
		});

		const children = [];
		const grantedChild = this.state.children.filter((child, index)=> {
			if (child.props._index === item.props._index) {
				return true;
			}else{
				children.push(child);
				return false;
			}
		}).pop();

		if (!grantedChild) return;

		var isLocated = false;
		const sortedChildren = children.reduce((children, child, index)=> {

			const layout = this._sortableItemLayout[child.props._index];

			// 如果 centerX centerY 落在 layout 内，则将 grantedChild 插入到 child 前面 

			if (!isLocated 
				&& centerX >= layout.x && centerX <= layout.x + layout.width 
				&& centerY >= layout.y && centerY <= layout.y + layout.height ) 
			{
				isLocated = true;
				return children.concat(index < oldIndex ? [grantedChild, child] : [child, grantedChild]);
			}

			return children.concat([child]);

		}, []);

		sortedChildren.forEach((child, index)=> {
			if (child.props._index === item.props._index) {
				newIndex = index;
			}
		});

		
		// TODO： 暂时，在没有 回调方法，不进行排序
		const shouldUpdate = isLocated && newIndex !== undefined && oldIndex !== undefined && this.props.onChangeChildIndex;

		!this.props.onChangeChildIndex && console.warn('Sortable 需要属情 onChangeChildIndex 才会执行排序');
		// 释放 shadowChild
		this.setState({
			
			children: shouldUpdate ? sortedChildren : this.state.children,
			shadowChild: undefined
		}, ()=> this.props.onChangeChildIndex && shouldUpdate && this.props.onChangeChildIndex({oldIndex, newIndex}))
	}

	_cloneChildren(props) {
		const children = Array.isArray(this.props.children) ? this.props.children : this.props.children ? [this.props.children] : [];
		return children.map((child, index)=> React.cloneElement(child, {
			_index: index,
			_onSortableItemLayout: this._onSortableItemLayout,
			_onGrantSortableItem: this._onGrantSortableItem,
			_onGrantItemMove: this._onGrantItemMove,
			_onGrantItemRelease: this._onGrantItemRelease
		}));
	}

	// 计算 shadowItem 当前的位置大小
	_getShadowItemLayout(originalItem, {nativeEvent: {pageX, pageY}}) {
		const layout = this._sortableItemLayout[originalItem.props._index];
		const location = this.state.shadowLocation;

		// step 1. 计算出当前位置与初始位置的相对位置
		const offsetX = pageX - location.pageX;
		const offsetY = pageY - location.pageY;

		// step 2. 计算出新的 left/top
		const left = location.left + offsetX;
		const top = location.top + offsetY;

		const {width, height} = location;

		return {left, top, width, height};
	}
}

class Item extends React.Component {
	render() {
		return (
			<View {...this.props}
				accessible={this.props.accessible !== false}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityComponentType={this.props.accessibilityComponentType}
        accessibilityTraits={this.props.accessibilityTraits}
        style={this.props.style}
        nativeID={this.props.nativeID}
        testID={this.props.testID}
        onLayout={this.props.onLayout}
        isTVSelectable={true}
        tvParallaxProperties={this.props.tvParallaxProperties}
        hitSlop={this.props.hitSlop}
        onLayout={this._onLayout}
        onStartShouldSetResponder={this._touchableHandleStartShouldSetResponder}
        onResponderGrant={this._touchableHandleResponderGrant}
        onResponderMove={this._touchableHandleResponderMove}
        onResponderRelease={this._touchableHandleResponderRelease}
      >
        {this.props.children}
			</View>
		);
	}

	_onLayout = (event)=> {
		this.props._onSortableItemLayout(this, event);
		this.props.onLayout && this.props.onLayout(event);
	}

  _touchableHandleStartShouldSetResponder = ({nativeEvent})=> {
  	return true;
  }
  // _touchableHandleResponderTerminationRequest = ({nativeEvent})=> {
  // 	console.log('_touchableHandleResponderTerminationRequest', nativeEvent);
  // }
  _touchableHandleResponderGrant = (event)=> {
  	this.props._onGrantSortableItem(this, event);
  	this.props.onResponderGrant && this.props.onResponderGrant(event);
  }
  _touchableHandleResponderMove = (event)=> {
  	this.props._onGrantItemMove(this, event);
  	this.props.onResponderMove && this.props.onResponderMove(event)
  }
  _touchableHandleResponderRelease = (event)=> {
  	this.props._onGrantItemRelease(this, event);
  	this.props.onResponderRelease && this.props.onResponderRelease(event)
  }
  // _touchableHandleResponderTerminate = ({nativeEvent})=> {
  // 	console.log('_touchableHandleResponderTerminate', nativeEvent);
  // }
}

Sortable.Item = Item;
export { Item };