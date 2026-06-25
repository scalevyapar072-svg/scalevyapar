type StyleMap = Record<string, string>

const REVEAL_STYLE_KEYS = [
  'homeLandingHeader',
  'homeHeroSection',
  'homeStatsBand',
  'homeAboutSection',
  'homeIndustriesSection',
  'homeHowSection',
  'homePricingSection',
  'homeIntakeSection',
  'homeHeroMiniStatCard',
  'homeHeroSliderCard',
  'homeHeroFloatCard',
  'homeBenefitCard',
  'homeCategoryCard',
  'homeTestimonialCard',
  'homePricingCard',
  'homeStatsCard',
  'homeCompanyBanner',
  'homeWorkerCtaCard',
  'pricingHeroSection',
  'pricingBenefitsBar',
  'pricingPlanCard',
  'pricingCompareSection',
  'pricingFaqSection',
  'pricingFaqCard',
  'pricingFinalCta',
  'card',
  'softCard',
  'darkCard',
  'ctaCard',
  'resultsSummaryCard',
  'resultsEmptyCard',
  'listCard',
  'searchWorkerCard',
  'searchHeroFloatingCard',
  'companyRegisterIllustrationCard',
  'companyRegisterBenefitCard',
  'companyRegisterInfoCard',
  'companyRegisterUploadCard',
  'companyRegisterSuccessCard',
  'signinHeroSection',
  'signinHeroIntro',
  'signinFormCard',
  'signinSidePanel',
  'signinFeatureStrip',
  'signinBannerSection',
  'contactHeroSection',
  'contactHeroFeature',
  'contactFormCard',
  'contactInfoCard',
  'contactQuickLinkCard',
  'contactMapSection',
  'contactFaqCard',
  'contactCtaPanel',
  'checkoutStepper',
  'checkoutCard',
  'companyDashboardHero',
  'companyDashboardSectionCard',
  'companyDashboardHelpCard',
  'companyDashboardQuickAction',
  'companyDashboardStatCard',
  'companySnapshotCard',
  'companyActionCard',
  'companyPanelJobCard',
  'companyPanelDetailStatCard',
  'companyPanelDetailStatCardActive',
  'companyPanelDetailCandidateCard',
  'companyJobPostGateCard',
  'jobPostPlanModalCard'
] as const

const CARD_STYLE_KEYS = [
  'homeHeroMiniStatCard',
  'homeHeroSliderCard',
  'homeHeroFloatCard',
  'homeBenefitCard',
  'homeCategoryCard',
  'homeTestimonialCard',
  'homePricingCard',
  'homeStatsCard',
  'pricingPlanCard',
  'pricingFaqCard',
  'card',
  'softCard',
  'darkCard',
  'ctaCard',
  'resultsSummaryCard',
  'resultsEmptyCard',
  'listCard',
  'searchWorkerCard',
  'companyRegisterIllustrationCard',
  'companyRegisterBenefitCard',
  'companyRegisterInfoCard',
  'companyRegisterUploadCard',
  'companyRegisterSuccessCard',
  'signinHeroIntro',
  'signinFormCard',
  'signinSidePanel',
  'signinFeatureStrip',
  'contactHeroFeature',
  'contactFormCard',
  'contactInfoCard',
  'contactQuickLinkCard',
  'contactFaqCard',
  'contactCtaPanel',
  'checkoutCard',
  'companyDashboardSectionCard',
  'companyDashboardHelpCard',
  'companyDashboardQuickAction',
  'companyDashboardStatCard',
  'companySnapshotCard',
  'companyActionCard',
  'companyPanelJobCard',
  'companyPanelDetailStatCard',
  'companyPanelDetailStatCardActive',
  'companyPanelDetailCandidateCard',
  'companyJobPostGateCard',
  'jobPostPlanModalCard'
] as const

const GLOW_STYLE_KEYS = [
  'homeHeaderPrimaryButton',
  'homeHeaderSecondaryButton',
  'homeHeaderGhostButton',
  'homeHeaderDashboardButton',
  'homeHeroPrimaryButton',
  'homeHeroSecondaryButton',
  'homeHeroGhostButton',
  'homeHeroSlideButton',
  'homeCategoryCtaButton',
  'homeCompanyBannerPrimary',
  'homeCompanyBannerSecondary',
  'homeSearchButton',
  'homeWorkerCtaButton',
  'companyRegisterPrimaryButton',
  'companyRegisterSecondaryButton',
  'primaryButton',
  'secondaryButton',
  'ghostButton',
  'companyActionMiniPrimary',
  'companyActionMiniSecondary',
  'searchPanelMiniButton',
  'workerActionPrimary',
  'workerActionSecondary',
  'whatsappButtonCompact',
  'searchWorkerPrimaryButton',
  'searchWorkerShortlistButton',
  'companyDashboardPrimaryButton',
  'companyDashboardSecondaryButton',
  'companyDashboardHelpButton',
  'companyDashboardPlanButton',
  'companyDashboardListButton',
  'companyDashboardMoreButton',
  'companyPanelSummaryButton',
  'companyPanelMenuButton',
  'companyPanelDetailContactButton',
  'companyPanelDetailWhatsappButton',
  'companyPanelDetailRejectButton',
  'companyPanelDetailShortlistButton',
  'pricingPlanButton',
  'signinSubmitButton',
  'signinSecondaryButton',
  'contactSubmitButton',
  'contactSocialButton',
  'contactQuickLinkButton',
  'contactMapButton',
  'contactCtaPrimaryButton',
  'contactCtaSecondaryButton',
  'checkoutApplyButton',
  'checkoutPayButton',
  'companyJobPostGatePrimary',
  'companyJobPostGateSecondary',
  'jobPostPlanModalPrimary',
  'jobPostPlanModalSecondary',
  'searchPaginationButton',
  'searchPaginationButtonActive',
  'companyPanelPaginationButton',
  'companyPanelPaginationButtonActive'
] as const

const NAV_STYLE_KEYS = [
  'homeLandingNavLink',
  'homeHeaderMenuButton',
  'navLink',
  'rozgarMobileBottomNavItem',
  'companyPanelSidebarItemButton',
  'signinForgotLink',
  'checkoutBackLink',
  'filterClearButton'
] as const

const PRESSABLE_SELECTOR = 'button, a[href][class], summary'

const getClassNames = (styles: StyleMap, keys: readonly string[]) =>
  keys.map(key => styles[key]).filter(Boolean)

const hasAnyClass = (element: Element, classNames: string[]) =>
  classNames.some(className => element.classList.contains(className))

const toSelector = (classNames: string[]) => classNames.map(className => `.${className}`).join(', ')

export function attachRozgarMotion(root: HTMLElement, styles: StyleMap) {
  const revealClassNames = getClassNames(styles, REVEAL_STYLE_KEYS)
  const cardClassNames = getClassNames(styles, CARD_STYLE_KEYS)
  const glowClassNames = getClassNames(styles, GLOW_STYLE_KEYS)
  const navClassNames = getClassNames(styles, NAV_STYLE_KEYS)
  const revealSelector = toSelector(revealClassNames)
  const motionRevealClass = styles.motionReveal
  const motionRevealVisibleClass = styles.motionRevealVisible
  const motionCardClass = styles.motionCard
  const motionPressableClass = styles.motionPressable
  const motionGlowClass = styles.motionGlow
  const motionNavClass = styles.motionNav
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const reduceMotion = reduceMotionQuery.matches
  const animatedRevealNodes = new WeakSet<HTMLElement>()
  const animatedPressableNodes = new WeakSet<HTMLElement>()
  let frameId = 0

  const observer = reduceMotion
    ? null
    : new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return
            const target = entry.target as HTMLElement
            target.classList.add(motionRevealVisibleClass)
            observer?.unobserve(target)
          })
        },
        {
          rootMargin: '0px 0px -12% 0px',
          threshold: 0.12
        }
      )

  const applyMotion = () => {
    root.querySelectorAll<HTMLElement>(PRESSABLE_SELECTOR).forEach(element => {
      if (animatedPressableNodes.has(element)) return

      element.classList.add(motionPressableClass)
      if (hasAnyClass(element, glowClassNames)) {
        element.classList.add(motionGlowClass)
      }
      if (hasAnyClass(element, navClassNames)) {
        element.classList.add(motionNavClass)
      }
      animatedPressableNodes.add(element)
    })

    if (!revealSelector) return

    let revealIndex = 0
    root.querySelectorAll<HTMLElement>(revealSelector).forEach(element => {
      if (animatedRevealNodes.has(element)) return

      element.classList.add(motionRevealClass)
      if (hasAnyClass(element, cardClassNames)) {
        element.classList.add(motionCardClass)
      }
      element.style.setProperty('--motion-delay', `${Math.min(revealIndex * 38, 340)}ms`)
      if (reduceMotion) {
        element.classList.add(motionRevealVisibleClass)
      } else {
        observer?.observe(element)
      }

      animatedRevealNodes.add(element)
      revealIndex += 1
    })
  }

  const queueApplyMotion = () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId)
    }
    frameId = window.requestAnimationFrame(applyMotion)
  }

  const mutationObserver = new MutationObserver(queueApplyMotion)
  mutationObserver.observe(root, { childList: true, subtree: true })

  applyMotion()

  return () => {
    if (frameId) {
      window.cancelAnimationFrame(frameId)
    }
    mutationObserver.disconnect()
    observer?.disconnect()
  }
}
