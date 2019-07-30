import * as React from 'react';
import HeaderContainer from '~/common/components/TELSConnect/HeaderContainer';
import { GetPreloadedData } from '~/common/helpers/Utils';


interface ITopLevelBoundaryProps {
	displayHeader?: boolean;
	children: React.ReactNode;
}

/**
 * This is the top-level error boundary for the whole app.
 * Errors here will be caught and cause the page content to be replaced
 * with a message indicating that something went wrong.
 * The header is always rendered so that the user can still navigate to a different page.
 */
export default class TopLevelBoundary extends React.PureComponent<ITopLevelBoundaryProps, { hasError: boolean }> {
	constructor(props: ITopLevelBoundaryProps) {
		super(props);

		this.state = { hasError: false };
	}

	static defaultProps: Partial<ITopLevelBoundaryProps> = { displayHeader: true };

	async componentDidCatch(err: Error, errInfo: React.ErrorInfo) {
		this.setState({ hasError: true });
		err.message += `\nReact Component Stack Trace:\n${errInfo.componentStack}`;
		await logException(err);
	}

	render() {
		return (
			<>
{ this.props.displayHeader ? <HeaderContainer /> : null }
{this.state.hasError ? <ErrorMessage /> : this.props.children }
</>
		);
	}
}

function ErrorMessage() {

	return (
		<div style={{ paddingLeft: 20 }}>
			<h1 className="sub-heading-title" data-test-class="error-title">Something went wrong.</h1>
		</div>
	);
}
