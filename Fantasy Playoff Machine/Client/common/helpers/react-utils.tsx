import React from 'react';


/**
 * Returns true if the provided child is an element of the provided component type.
 * This uses typescript's "type narrowing" feature to allow you to use this in boolean expressions to "auto-cast" the child:
 * 
 * ```typescript
 * // child is React.ReactChild here
 * if (isChildOfType(child, MyComponent)) {
 *     // in here, child is React.ReactElement<IMyComponentProps>
 *     const myProp = child.props.myProp;
 * }
 * ```
 */
export function isChildOfType<P>(child: React.ReactChild, component: React.ComponentType<P>): child is React.ReactElement<P> {
	return React.isValidElement(child) && child.type === component;
}

/**
 * Returns true if all of the provided children are elements of the provided component type.
 * This uses typescript's "type narrowing" feature to allow you to use this in boolean expressions to "auto-cast" the children:
 * 
 * ```typescript
 * // children is React.ReactChild[] here
 * if (areChildrenOfType(children, MyComponent)) {
 *     // in here, children is Array<React.ReactElement<IMyComponentProps>>
 *     const myProps = children.map(child => child.props.myProp);
 * }
 * ```
 */
export function areChildrenOfType<P>(children: React.ReactChild[], component: React.ComponentType<P>): children is Array<React.ReactElement<P>> {
	return children.every(_ => isChildOfType(_, component));
}

/**
 * Returns true if the provided child is a fragment (`<>{elements}</>`).
 * This uses typescript's "type narrowing" feature to allow you to easily extract the children from the fragment:
 * 
 * ```typescript
 * // child is React.ReactChild here
 * if (isChildFragment(child)) {
 *     // in here, child.props.children is accessible
 *     const children = React.Children.toArray(child.props.children);
 * }
 * ```
 */
export function isChildFragment(child: React.ReactChild): child is React.ReactElement<{ children: React.ReactNode }> {
	return React.isValidElement(child) && child.type === React.Fragment;
}

/**
 * Given an array of children (from `React.Children.toArray(props.children)`), recursively flatten all fragments in that array.
 * The result is semantically the same and can be processed by components that manipulate their children.
 */
export function flattenFragments(children: React.ReactChild[]): React.ReactChild[] {
	return children.reduce((list, next) => [
		...list,
		...(isChildFragment(next) ? flattenFragments(React.Children.toArray(next.props.children)) : [next])
	], []);
}

/**
 * Gets a string representation of a React.ReactChild
 */
export function stringifyChild(child: React.ReactChild) {
	if (typeof child === 'string' || typeof child === 'number') {
		return '<text contents>';
	} else {
		const type = child.type;
		if (typeof type === 'string') {
			return `<${type} />`;
		} else if (type.displayName) {
			return `<${type.displayName} />`;
		} else {
			return `<${type.name} />`;
		}
	}
}
