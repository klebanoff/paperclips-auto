(() => {
  if (window.__paperclips_auto === true)
    return;
  window.__paperclips_auto = true;

  let cache = {};
  let phase3Timer = Date.now();

  // Global Rule Parameters
  const AcceptOffer = true;
  const MaxMemory = 300;
  const MemoryToProcessorsRatio = 2;
  const PreferredStrategyIndex = 4; // Greedy
  const SwarmComputingLevel = 150;
  const ExcludeProjects = ['projectButton200', 'projectButton201', 'projectButton46', 'projectButton35'];
  
  // Phase 1 Rule Parameters
  const PhaseOneCrucialProjects = [
      'projectButton3', 
      'projectButton6', 
      'projectButton13', 
      'projectButton14', 
      'projectButton15', 
      'projectButton17', 
      'projectButton19', 
      'projectButton50', 
      'projectButton51'];
  const MinWire = 10;
  const MaxMarketing = 20;
  const MinClipPrice = 0.01;
  const MaxClipPrice = 2.50;
  const UnsoldClipsToSalesRatio = 10;
  const AutoclipperToMarketingRatio = 12;
  const MaxAutoclippers = 100;
  const MaxMegaclippers = 300;
  const MaxAutoclippersForManualClipping = 20;
  const InvestmentStrategyIndex = 2; // High risk
  const InvestmentMaxLevel = 6;
  const MinWireForInvestment = 5000;
  const MinPassiveInvestmentLevel = 30000;
  const MinActiveInvestmentLevel = 10000000;
  const MinFundsForActiveInvestment = 900000;
  const MinClipsForNextPhase = 300 * 1000000;
  // Phase 2 Rule Parameters
  const MaxDrones = 2000000;
  const MaxFactories = 160;
  const MaxStorage = 1200;
  const PowerProductionBias = 100;
  const StorageToPowerProductionRatio = 70;
  const DroneToFactorySquaredRatio = 7;
  const FarmDroneBias = 200;
  const MinProcessorsForNextPhase = 200;
  // Phase 3 Rule Parameters
  const SecDronesCanHarvest = 30;
  // non-combat probes
  const ProbeSpeedPercent = 0.10; 
  const ProbeNavPercent = 1;
  const ProbeRepPercent = 0.45;
  const ProbeHazPercent = 0.60;
  const ProbeFacPercent = 1;
  const ProbeHarvPercent = 1;
  const ProbeWirePercent = 1;
  // combat is independent of non-combat percentages
  const ProbeCombatPercent = 0.40;

  const ProbeSettingsStart = [1,1,9,6,1,1,1,0]

  const ProbeSettingsCombat = [1,1,6,4,1,1,1,5]

  const ProbeSettingsFirstExpansion = [2,1,13,6,1,1,1,5]
  
  function GetQChipComputeValue()
  {
    let chips = document.querySelectorAll('.qChip');
    if (chips.length > 0) {
      return [].reduce.call(chips, (sum, el) => sum + parseFloat(el.style.opacity), 0) / chips.length;
    }
  }
  
  function validateProbePercentages() {
    const percentages = [ProbeSpeedPercent, ProbeNavPercent, ProbeRepPercent, ProbeHazPercent, 
      ProbeFacPercent, ProbeHarvPercent, ProbeWirePercent];
    const precombatAllocation = percentages.reduce((acc, pct) => acc + Math.floor(20 * pct), 0);
    const minCombatAllocation = percentages.reduce((acc, pct) => 
      Math.min(acc, Math.floor(20 * (1-ProbeCombatPercent) * pct)), Number.MAX_VALUE);

    if (precombatAllocation < 20)
      throw 'Non-Combat Probe Allocation does not equal 10';
    if (minCombatAllocation === 0)
      throw 'Combat Probe Allocation will reduce a probe to 0'
  }

  const gameRules = [
    {
      description: 'add processor',
      timeout: 100,
      control: 'btnAddProc',
      condition: () => exists('processorDisplay')
        && (val('processors')*MemoryToProcessorsRatio < val('memory')
          || val('memory') >= MaxMemory)
    },
    {
      description: 'add memory',
      timeout: 62,
      control: 'btnAddMem',
      condition: () => exists('memoryDisplay') && val('memory') < MaxMemory
    },
    {
      description: 'The Universe Next Door ',
      timeout: 100,
      control: () => el('projectButton200'),
      condition: () => exists('prestigeDiv') && exists('projectButton200') && val('prestigeUcounter') < val('prestigeScounter')
    },
    {
      description: 'The Universe Within ',
      timeout: 100,
      control: () => el('projectButton201'),
      condition: () => exists('prestigeDiv') && exists('projectButton201')&& val('prestigeUcounter') >= val('prestigeScounter')
    },
    {
      description: 'Space Exploration ',
      timeout: 100,
      control: () => el('projectButton46'),
      condition: () => exists('projectButton46') && enabled('projectButton46') && val('processors') > MinProcessorsForNextPhase
    },
    {
      description: 'Release the HypnoDrones ',
      timeout: 100,
      control: () => el('projectButton35'),
      condition: () => exists('projectButton35') && enabled('projectButton35') && val('clips') > MinClipsForNextPhase
    },
    {
      description: (control) => 'project: ' + control.querySelector('span').innerText,
      timeout: 4000,
      control: () => [].find.call(document.querySelectorAll('.projectButton:enabled'), (p) => {
        const title = p.querySelector('span').innerText;
        if (!exists('qComputing') || isNaN(GetQChipComputeValue()) || GetQChipComputeValue() === 0)
        {
          return PhaseOneCrucialProjects.includes(p.id);
        }
        if (ExcludeProjects.includes(p.id))
        {
          return false;
        }
        return title.trim().length > 0 && title.indexOf(AcceptOffer ? 'Reject' : 'Accept') < 0;
      }),
      condition: () => true
    },
    {
      description: 'tournaments',
      condition: () => exists('tournamentManagement'),
      rules: [
        {
          description: 'pick strategy',
          control: 'stratPicker',
          condition: () => el('stratPicker').selectedIndex !== Math.min(PreferredStrategyIndex, el('stratPicker').querySelectorAll('option').length-1),
          action: (control) => control.selectedIndex = Math.min(PreferredStrategyIndex, control.querySelectorAll('option').length - 1)
        },
        {
          description: 'run tournament',
          control: 'btnRunTournament',
          condition: () => true
        },
        {
          description: '# new tournament',
          control: 'btnNewTournament',
          condition: () => true
        }
      ]
    },
    {
      description: '# q compute',
      control: 'btnQcompute',
      continue: true,
      condition: () => {
          return GetQChipComputeValue() > 0;
      }
    },
    {
      description: 'swarm control',
      condition: () => exists('swarmEngine'),
      rules: [
        {
          description: 'entertain swarm',
          control: 'btnEntertainSwarm',
          condition: () => exists('entertainButtonDiv')
        },
        {
          description: 'synchronize swarm',
          control: 'btnSynchSwarm',
          condition: () => exists('synchButtonDiv')
        },
        {
          description: 'swarm computing adjustment phase 2',
          control: 'slider',
          condition: () => exists('powerDiv') && (val('availableMatterDisplay') !== 0 && val('acquiredMatterDisplay') !== 0) && exists('swarmSliderDiv') && parseFloat(el('slider').value) !== SwarmComputingLevel,
          action: (control) => control.value = SwarmComputingLevel
        },
        {
          description: 'swarm computing adjustment phase 2(end) 100% compute',
          control: 'slider',
          condition: () => exists('powerDiv') && (val('availableMatterDisplay') === 0 && val('acquiredMatterDisplay') === 0) && exists('swarmSliderDiv') && parseFloat(el('slider').value) !== 200,
          action: (control) => control.value = 200
        },
        {
          description: 'swarm computing adjustment phase 3',
          control: 'slider',
          condition: () => exists('probeDesignDiv') && exists('swarmSliderDiv') && parseFloat(el('slider').value) !== swarmControl3rdPhaseValue(),
          action: (control) => control.value = swarmControl3rdPhaseValue()
        }
      ]
    },
    {
      description: 'phase 1: money to paperclips',
      condition: () => exists('businessDiv'),
      rules: [
        {
          description: '# buy wire',
          control: 'btnBuyWire',
          condition: () => val('wire') < MinWire
        },
        {
          description: 'expand marketing',
          control: 'btnExpandMarketing',
          condition: () => val('funds') > val('adCost') + val('wireCost')
            && val('marketingLvl') < MaxMarketing
        },    
        {
          description: '# lower price',
          timeout: 2000,
          control: 'btnLowerPrice',
          condition: () => val('unsoldClips') > val('avgSales') * UnsoldClipsToSalesRatio 
            && val('margin') > MinClipPrice
        },
        {
          description: '# raise price',
          timeout: 2000,
          control: 'btnRaisePrice',
          condition: () => val('unsoldClips') < val('avgSales') / UnsoldClipsToSalesRatio
            && val('wire') > MinWire && val('margin') < MaxClipPrice
        },
        {
          description: 'investment management',
          condition: () => exists('investmentEngine'),
          rules: [
            {
              description: 'improve investments',
              control: 'btnImproveInvestments',
              condition: () => val('investmentLevel') < InvestmentMaxLevel
            },
            {
              description: 'investment strategy',
              control: 'investStrat',
              condition: () => el('investStrat').selectedIndex != InvestmentStrategyIndex,
              action: (control) => control.selectedIndex = InvestmentStrategyIndex
            },
            {
              description: 'withdraw',
              control: 'btnWithdraw',
              condition: () => (val('investmentBankroll') + val('funds') > [].reduce.call(document.querySelectorAll('.projectButton'), (min, el) => { 
                  const match = el.innerText.match(/\(\$(.*)\)/);
                  return Math.min(min, match ? match[1].replace(/,/g, '') : min);
                }, Number.MAX_VALUE)
                  || val('clipmakerRate') === 0)
            },
            {
              description: 'invest',
              control: 'btnInvest',
              timeout: 10000,
              condition: () => ((val('portValue') < MinActiveInvestmentLevel && val('funds') > MinFundsForActiveInvestment) 
                  || val('portValue') < MinPassiveInvestmentLevel)
                && val('wire') > MinWireForInvestment
            }
          ]
        },
        {
          description: 'buy autoclippers',
          control: 'btnMakeClipper',
          condition: () => val('clipmakerLevel2') < Math.min(val('marketingLvl')*AutoclipperToMarketingRatio, MaxAutoclippers)
            && val('funds') > val('clipperCost') + val('wireCost')
        },
        {
          description: 'buy megaclippers',
          control: 'btnMakeMegaClipper',
          condition: () => exists('megaClipperDiv')
            && val('funds') > val('megaClipperCost') + val('wireCost')
            && val('megaClipperLevel') < MaxMegaclippers
        },
        {
          description: '# make paperclip',
          control: 'btnMakePaperclip',
          condition: () => val('clipmakerLevel2') < MaxAutoclippersForManualClipping
        }
      ]
    },
    {
      description: 'phase 2: earth to paperclips',
      condition: () => exists('powerDiv'),
      rules: [
        {
          description: 'make factory',
          timeout: 120,
          control: 'btnMakeFactory',
          condition: () => exists('factoryDiv')
            && (val('factoryLevelDisplay') < MaxFactories)
            && ((val('powerConsumptionRate')+PowerProductionBias) <= val('powerProductionRate')
              || val('factoryLevelDisplay') === 0)
        },
        {
          description: '# make battery tower',
          control: 'btnMakeBattery',
          condition: () => exists('powerDiv')
            && val('maxStorage') <= val('powerProductionRate')*StorageToPowerProductionRatio && val('batteryLevel') < MaxStorage
        },
        {
          description: 'drone manufacturing',
          condition: () => exists('harvesterDiv') && exists('wireDroneDiv'),
          rules: [
            {
              description: '# make harvester x 1000',
              control: 'btnHarvesterx1000',
              condition: () => shouldMakeHarvesterDrone(val('harvesterLevelDisplay'), 1000)
            },
            {
              description: '# make wire drone x 1000',
              control: 'btnWireDronex1000',
              condition: () => shouldMakeWireDrone(val('wireDroneLevelDisplay'), 1000)
            },
            {
              description: '# make harvester x 100',
              control: 'btnHarvesterx100',
              condition: () => shouldMakeHarvesterDrone(val('harvesterLevelDisplay'), 100)
            },
            {
              description: '# make wire drone x 100',
              control: 'btnWireDronex100',
              condition: () => shouldMakeWireDrone(val('wireDroneLevelDisplay'), 100)
            },
            {
              description: '# make harvester x 10',
              control: 'btnHarvesterx10',
              condition: () => shouldMakeHarvesterDrone(val('harvesterLevelDisplay'), 10)
            },
            {
              description: '# make wire drone x 10',
              control: 'btnWireDronex10',
              condition: () => shouldMakeWireDrone(val('wireDroneLevelDisplay'), 10)
            },
            {
              description: '# make harvester',
              control: 'btnMakeHarvester',
              condition: () => shouldMakeHarvesterDrone(val('harvesterLevelDisplay'), 1)
                || val('harvesterLevelDisplay') === 0
            },
            {
              description: '# make wire drone',
              control: 'btnMakeWireDrone',
              condition: () => shouldMakeWireDrone(val('wireDroneLevelDisplay'), 1)
                || val('wireDroneLevelDisplay') === 0
            }
          ]
        },
        {
          description: '# make solar farm x 100',
          control: 'btnFarmx100',
          condition: () => exists('powerDiv')
            && (val('powerConsumptionRate')+getDroneBias()) >= val('powerProductionRate')
            && enabled('btnFarmx100')
        },
        {
          description: '# make solar farm x 10',
          control: 'btnMakeFarm10',
          condition: () => exists('powerDiv')
            && (val('powerConsumptionRate')+getDroneBias()) >= val('powerProductionRate')
            && enabled('btnFarmx10')
        },
        {
          description: '# make solar farm',
          control: 'btnMakeFarm',
          condition: () => exists('powerDiv')
            && (val('powerConsumptionRate')+getDroneBias()) >= val('powerProductionRate')
            && (val('factoryLevelDisplay') > 0)
            && ((val('harvesterLevelDisplay') > 0 && val('wireDroneLevelDisplay') > 0)
              || val('powerProductionRate') == 0)
        }
      ]
    },
    {
      description: 'phase 3: the universe to paperclips',
      condition: () => exists('probeDesignDiv'),
      rules: [
        {
          description: 'increase probe trust',
          control: 'btnIncreaseProbeTrust',
          condition: () => true
        },
        {
          description: 'increase max trust',
          control: 'btnIncreaseMaxTrust',
          condition: () => true
        },
        {
          description: 'raise probe speed',
          control: 'btnRaiseProbeSpeed',
          condition: () => shouldRaiseProbeLevel(val('probeSpeedDisplay'), 0)
        },
        {
          description: 'lower probe speed',
          control: 'btnLowerProbeSpeed',
          condition: () => shouldLowerProbeLevel(val('probeSpeedDisplay'), 0)
        },
        {
          description: 'raise probe nav',
          control: 'btnRaiseProbeNav',
          condition: () => shouldRaiseProbeLevel(val('probeNavDisplay'), 1)
        },
        {
          description: 'lower probe nav',
          control: 'btnLowerProbeNav',
          condition: () => shouldLowerProbeLevel(val('probeNavDisplay'), 1)
        },
        {
          description: 'raise probe rep',
          control: 'btnRaiseProbeRep',
          condition: () => shouldRaiseProbeLevel(val('probeRepDisplay'), 2)
        },
        {
          description: 'lower probe rep',
          control: 'btnLowerProbeRep',
          condition: () => shouldLowerProbeLevel(val('probeRepDisplay'), 2)
        },
        {
          description: 'raise probe haz',
          control: 'btnRaiseProbeHaz',
          condition: () => shouldRaiseProbeLevel(val('probeHazDisplay'), 3)
        },
        {
          description: 'lower probe haz',
          control: 'btnLowerProbeHaz',
          condition: () => shouldLowerProbeLevel(val('probeHazDisplay'), 3)
        },
        {
          description: 'raise probe harv',
          control: 'btnRaiseProbeHarv',
          condition: () => shouldRaiseProbeLevel(val('probeHarvDisplay'), 4)
        },
        {
          description: 'lower probe harv',
          control: 'btnLowerProbeHarv',
          condition: () => shouldLowerProbeLevel(val('probeHarvDisplay'), 4)
        },
        {
          description: 'raise probe wire',
          control: 'btnRaiseProbeWire',
          condition: () => shouldRaiseProbeLevel(val('probeWireDisplay'),5)
        },
        {
          description: 'lower probe wire',
          control: 'btnLowerProbeWire',
          condition: () => shouldLowerProbeLevel(val('probeWireDisplay'), 5)
        },
        {
          description: 'raise probe fac',
          control: 'btnRaiseProbeFac',
          condition: () => shouldRaiseProbeLevel(val('probeFacDisplay'), 6)
        },
        {
          description: 'lower probe fac',
          control: 'btnLowerProbeFac',
          condition: () => shouldLowerProbeLevel(val('probeFacDisplay'), 6)
        },
        {
          description: 'raise probe combat',
          control: 'btnRaiseProbeCombat',
          condition: () => shouldRaiseProbeLevel(val('probeCombatDisplay'), 7)
        },
        {
          description: 'lower probe combat',
          control: 'btnLowerProbeCombat',
          condition: () => shouldLowerProbeLevel(val('probeCombatDisplay'), 7)
        },
        {
          description: 'launch probe',
          control: 'btnMakeProbe',
          condition: () => val('probesTotalDisplay') === 0 && val('probeTrustUsedDisplay') >= 10
        }
      ]
    },
    {
      description: 'make paperclip',
      control: 'btnMakePaperclip',
      condition: () => !exists('businessDiv') && !exists('powerDiv') && !exists('probeDesignDiv')
    }
  ]

  function shouldMakeHarvesterDrone(currentLevel, multiplier) {
    return (((currentLevel + multiplier <= DroneToFactorySquaredRatio * val('factoryLevelDisplay') ** 2)
      && (currentLevel + multiplier * 10 > DroneToFactorySquaredRatio * val('factoryLevelDisplay') ** 2)) || val('factoryLevelDisplay') === MaxFactories)
      && ((val('powerConsumptionRate')+PowerProductionBias) <= val('powerProductionRate'))
      && (currentLevel < MaxDrones)
  }

  function shouldMakeWireDrone(currentLevel, multiplier) {
    return (val('maps')>val('wpps') || val('acquiredMatterDisplay') > 0 || val('wireDroneLevelDisplay') + multiplier < val('harvesterLevelDisplay'))
    && ((val('powerConsumptionRate')+PowerProductionBias) <= val('powerProductionRate')) 
    && (currentLevel < MaxDrones)
  }

  function getDroneBias()
  {
    if ((val('harvesterLevelDisplay')+FarmDroneBias) > 10000)
    {
      return 10000;
    }
    return val('harvesterLevelDisplay')+FarmDroneBias;
  }

  function shouldRaiseProbeLevel(currentLevel, index) {
    let settings = GetProbeSettings(ProbeSettingsStart);
    //if (exists('combatButtonDiv') && exists('honorDiv'))
    if (exists('combatButtonDiv'))
    {
      settings = GetProbeSettings(ProbeSettingsCombat);
      if (val('probeTrustDisplay')>=30)
      {
        settings = GetProbeSettings(ProbeSettingsFirstExpansion);
      }
    }
    let desiredLevel = settings[index];
    if (index === 2)
    {
      desiredLevel = val('probeTrustDisplay') - settings.reduce((acc,curr,i) => { return i===2?acc:  acc +curr },0);
    }
    return currentLevel < desiredLevel
  }

  function shouldLowerProbeLevel(currentLevel, index) {
    let settings = GetProbeSettings(ProbeSettingsStart);
    //if (exists('combatButtonDiv') && exists('honorDiv'))
    if (exists('combatButtonDiv'))
    {
      settings = GetProbeSettings(ProbeSettingsCombat);
      if (val('probeTrustDisplay')>=30)
      {
        settings = GetProbeSettings(ProbeSettingsFirstExpansion);
      }
    }
    let desiredLevel = settings[index];
    if (index === 2)
    {
      desiredLevel = val('probeTrustDisplay') - settings.reduce((acc,curr,i) => { return i===2?acc:  acc +curr },0);
    }
    return currentLevel > desiredLevel
  }

  function swarmControl3rdPhaseValue()
  {
    if (phase3CheckInNeedOfClips())
    {
      return SwarmComputingLevel;
    }
    return 200;
  }

  function GetProbeSettings(probeSettings)
  {
    if (phase3CheckInNeedOfClips())
    {
      return probeSettings;
    }
    return probeSettings.map((e, i, a) => {
      if (i === 2)
      {
        return e + 3;
      }
      if (i === 4 || i === 5 || i === 6)
      {
        return e - 1;
      }
      return e;
    });
  }

  function phase3CheckInNeedOfClips()
  {
    if (!exists('probeDesignDiv'))
    {
      return false;
    }
    if (Date.now() <= phase3Timer)
    {
      return true;
    }
    if (val('unusedClipsDisplay') === 0 || 
    (val('harvesterLevelSpace') === 0 || 
    val('wireDroneLevelSpace') === 0 || 
    val('factoryLevelDisplaySpace') === 0 || 
    !enabled('btnMakeProbe')))
    {
      phase3Timer = Date.now() + SecDronesCanHarvest*1000;
      return true;
    }
    return false;
  }

  function el(id) {
    if (id in cache) {
      return cache[id];
    }
    const element = document.getElementById(id);
    cache[id] = element;
    return element;
  }

  function val(id) {
    return parseFloat(el(id).innerHTML.replace(/,/g, ''));
  }

  function exists(id) {
    return el(id) !== null && el(id).style.display !== 'none';
  }

  function enabled(id) {
    return exists(id) && !el(id).disabled;
  }

  function updateActionPointer(control) {
    actionPointer.style.left = control.offsetLeft;
    actionPointer.style.top = control.offsetTop;
    actionPointer.style.display = 'block';
    clearTimeout(window.actionPointerTimeoutId);

    window.actionPointerTimeoutId = setTimeout(() => {
      actionPointer.style.display = 'none';
    }, 3000);
  }

  function skipForTimeout(rule) {
    if (!rule.timeout)
      return false;
    const now = Date.now();
    if (now < rule.valid_time) {
      return true;
    } else {
      rule.valid_time = now + rule.timeout;
      return false;
    }
  }

  function evaluateRules(rules) {
    return rules.some(rule => {
      if (rule.rules && rule.condition()) {
        return evaluateRules(rule.rules);
      }

      const control = typeof(rule.control) === 'function' ? rule.control() : el(rule.control);
      if (control && enabled(control.id) && !skipForTimeout(rule) && rule.condition(control)) {
        if (typeof(rule.action) === 'function') {
          rule.action(control);
        } else {
          control.click();
        }

        updateActionPointer(control);

        if (rule.description) {
          const desc = typeof(rule.description) === 'function' ? rule.description(control) : rule.description;
          if (desc.indexOf('#') !== 0)
            console.log(desc);
        }

        return !rule.continue;
      }

      return false;
    });
  }
  
  function autoLoop() {
    cache = {};
    evaluateRules(gameRules);
  }

  validateProbePercentages();

  const actionPointer = document.createElement('div');
  actionPointer.id = 'actionPointer';
  actionPointer.style = 'position:absolute;border-radius:4px;height:8px;width:8px;background-color:red;display:none';
  document.body.appendChild(actionPointer);

  setInterval(autoLoop, 30);

})();
