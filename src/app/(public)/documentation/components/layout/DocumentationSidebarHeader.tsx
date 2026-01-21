import MainProjectSelection from '@/components/MainProjectSelection';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';

type DocumentationSidebarHeaderProps = {
	className?: string;
};

function DocumentationSidebarHeader(props: DocumentationSidebarHeaderProps) {
	const { className = '' } = props;

	return (
		<div className={clsx('flex items-center space-x-2', className)}>
			<img
				className="logo-icon h-8 w-8"
				src="/assets/images/logo/logo.png"
				alt="logo"
			/>
			<div className="logo-text flex flex-auto flex-col">
				<Typography className="tracking-light text-2xl leading-none font-semibold">FUSE</Typography>
				<Typography
					className="tracking-light text-xl leading-none font-bold"
					color="primary"
				>
					DOCS
				</Typography>
			</div>
			<MainProjectSelection />
		</div>
	);
}

export default DocumentationSidebarHeader;
