'use client'

import * as React from 'react'
import * as DrawerPrimitive from 'vaul'

import { cn } from '@/lib/utils'

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Drawer.Root>) => (
  <DrawerPrimitive.Drawer.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = 'Drawer'

const DrawerTrigger = DrawerPrimitive.Drawer.Trigger

const DrawerClose = DrawerPrimitive.Drawer.Close

const DrawerPortal = DrawerPrimitive.Portal

const DrawerOverlay = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Drawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Drawer.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Drawer.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-background/80 backdrop-blur-sm')}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Drawer.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Drawer.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Drawer.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Drawer.Content
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col border bg-background shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </DrawerPrimitive.Drawer.Content>
  </DrawerPortal>
))
DrawerContent.displayName = DrawerPrimitive.Drawer.Content.displayName

const DrawerHeader = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-1.5 p-4', className)}
    {...props}
  />
)
DrawerHeader.displayName = 'DrawerHeader'

const DrawerFooter = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 p-4', className)} {...props} />
)
DrawerFooter.displayName = 'DrawerFooter'

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Drawer.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Drawer.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Drawer.Title
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Drawer.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Drawer.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Drawer.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Drawer.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Drawer.Description.displayName

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerOverlay,
  DrawerPortal,
}
