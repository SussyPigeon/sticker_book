import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type react from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	`font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer
	focus:ring-primary/50 focus:outline-none
	`,
	{
		variants: {
			variant: {
				primary: `
			text-foreground-primary
			bg-primary
			hover:bg-[color-mix(in_oklch,var(--color-primary)_95%,var(--color-background-primary)_5%)]
		`,
				secondary: `
			text-foreground-primary
			bg-secondary
			hover:bg-[color-mix(in_oklch,var(--color-secondary)_95%,var(--color-foreground-primary)_5%)]
		`,
				success: `
			text-foreground-primary
			bg-success
			hover:bg-[color-mix(in_oklch,var(--color-success)_95%,var(--color-background-primary)_5%)]
		`,
				danger: `
			text-foreground-primary
			bg-danger
			hover:bg-[color-mix(in_oklch,var(--color-danger)_90%,var(--color-background-primary)_10%)]
		`,
				ghost: `
			text-foreground-primary
			bg-transparent
			hover:bg-secondary/25
		`,
			},
			size: {
				sm: "px-3 py-1.5 text-sm",
				md: "px-4 py-2 text-base",
				lg: "px-6 py-3 text-lg",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

const Button = ({
	className,
	variant,
	size,
	asChild = false,
	...props
}: react.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & { asChild?: boolean }) => {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
};

export { Button, buttonVariants };
