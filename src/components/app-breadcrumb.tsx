"use client"

import { useBreadcrumb } from "@/hooks/use-breadcrumb"
import React from "react"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "./ui/breadcrumb"

export const AppBreadcrumb = () => {
	const { breadcrumbs } = useBreadcrumb()

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbs?.map((item, index) => (
					<React.Fragment
						key={`${
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							index
						}`}
					>
						<BreadcrumbItem>
							<BreadcrumbLink href={`${item.path}`}>
								{item.label}
							</BreadcrumbLink>
						</BreadcrumbItem>
						{breadcrumbs?.length - 1 !== index && <BreadcrumbSeparator />}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
