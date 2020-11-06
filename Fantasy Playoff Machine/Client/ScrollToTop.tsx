﻿import * as React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

type IScrollToTopProps = RouteComponentProps<{}>;

class ScrollToTop extends React.PureComponent<IScrollToTopProps> {
	componentDidUpdate(prevProps: IScrollToTopProps) {
		if (this.props.location !== prevProps.location) {
			window.scrollTo(0, 0);
		}
	}

	render() {
		return this.props.children;
	}
}

export default withRouter(ScrollToTop);
